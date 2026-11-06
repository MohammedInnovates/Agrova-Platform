import uuid
import random
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import hash_password, verify_password
from app.models.order import Order
from app.models.product import Product
from app.models.pickup_pin import PickupPin
from app.models.user import User
from app.models.wallet import WalletAccount, WalletTransaction
from app.schemas.order import OrderCreateInput, OrderStatusUpdate, PinVerifyRequest
from app.services.order_service import create_order
from app.services.notification_service import alert_admin
from app.api.deps import require_admin, get_current_user, require_admin_or_driver

router = APIRouter()

def _serialize_order(order: Order):
    return {
        "id": str(order.id), "user_id": str(order.user_id),
        "customer_name": order.user.full_name if order.user else "Unknown",
        "customer_phone": order.user.phone if order.user else "Unknown",
        "estate_name": order.estate.name if order.estate else "Custom Address",
        "mode": order.mode, "quantity": float(order.quantity),
        "subtotal_kobo": order.subtotal_kobo, "discount_kobo": order.discount_kobo, "total_kobo": order.total_kobo,
        "status": order.status, "batch_window_id": str(order.batch_window_id) if order.batch_window_id else None,
        "delivery_date": order.delivery_date.isoformat() if order.delivery_date else None,
        "delivery_type": order.delivery_type, "fulfillment_method": order.fulfillment_method,
        "delivery_directions": order.delivery_directions,
        "items": [{"id": str(i.id), "product_id": str(i.product_id), "product_name": i.product_name, "product_brand": i.product_brand, "product_unit": i.product_unit, "quantity": float(i.quantity), "unit_price_kobo": i.unit_price_kobo, "original_unit_price_kobo": i.original_unit_price_kobo, "line_subtotal_kobo": i.line_subtotal_kobo, "line_discount_kobo": i.line_discount_kobo, "line_total_kobo": i.line_total_kobo, "item_status": i.item_status} for i in order.items]
    }

@router.post("/")
async def create_new_order(payload: OrderCreateInput, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    order = await create_order(db, payload)
    result = await db.execute(select(Order).options(selectinload(Order.items)).where(Order.id == order.id))
    full_order = result.scalar_one()
    
    msg = f"New Order #{full_order.id[:8]} placed for ₦{full_order.total_kobo/100:,.0f}."
    background_tasks.add_task(alert_admin, db, "new_order", msg, "order", full_order.id)
    
    return _serialize_order(full_order)

@router.get("/user/{user_id}")
async def get_user_orders(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).options(selectinload(Order.items)).where(Order.user_id == user_id).order_by(Order.created_at.desc()))
    return [_serialize_order(o) for o in result.scalars().all()]

@router.get("/{order_id}")
async def get_order(order_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).options(selectinload(Order.items)).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    return _serialize_order(order)

@router.post("/{order_id}/cancel")
async def cancel_order(order_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).options(selectinload(Order.items)).where(Order.id == order_id).with_for_update())
    order = result.scalar_one_or_none()
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "PENDING_PAYMENT": raise HTTPException(status_code=400, detail="Only pending orders can be cancelled")
    
    for item in order.items:
        prod_result = await db.execute(select(Product).where(Product.id == item.product_id))
        product = prod_result.scalar_one_or_none()
        if product: product.stock_quantity += int(item.quantity)

    order.status = "CANCELLED"
    await db.commit()
    return {"status": "success", "message": "Order cancelled and stock restored"}

@router.post("/{order_id}/pay-with-wallet")
async def pay_with_wallet(order_id: uuid.UUID, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Order).where(Order.id == order_id).with_for_update())
    order = result.scalar_one_or_none()
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "PENDING_PAYMENT": raise HTTPException(status_code=400, detail="Order is not pending payment")
    if order.user_id != current_user.id: raise HTTPException(status_code=403, detail="Not authorized")

    w_result = await db.execute(select(WalletAccount).where(WalletAccount.user_id == current_user.id).with_for_update())
    wallet = w_result.scalar_one_or_none()
    if not wallet: raise HTTPException(status_code=404, detail="Wallet not found")

    if wallet.balance_kobo < order.total_kobo:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance.")

    wallet.balance_kobo -= order.total_kobo
    db.add(WalletTransaction(
        wallet_id=wallet.id, direction="DEBIT", amount_kobo=order.total_kobo,
        balance_after_kobo=wallet.balance_kobo, reason="ORDER_PAYMENT",
        status="COMPLETED", reference=f"order-pay-{order.id}", related_order_id=order.id
    ))
    order.status = "PAID"
    await db.commit()

    msg = f"💰 Wallet Payment! Order #{order.id[:8]} paid via Wallet for ₦{order.total_kobo/100:,.0f}."
    background_tasks.add_task(alert_admin, db, "order_paid_wallet", msg, "order", order.id)

    return {"status": "success", "message": "Payment successful via Wallet"}

# --- FULFILLMENT ROUTES (Admin or Driver) ---

@router.get("/driver/all")
async def get_driver_orders(db: AsyncSession = Depends(get_db), user: User = Depends(require_admin_or_driver)):
    # Drivers only need to see orders that are Procured or Dispatched
    result = await db.execute(select(Order).options(selectinload(Order.items)).where(Order.status.in_(["PROCURED", "DISPATCHED"])).order_by(Order.created_at.desc()))
    return [_serialize_order(o) for o in result.scalars().all()]

@router.get("/admin/all")
async def get_all_orders(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc()))
    return [_serialize_order(o) for o in result.scalars().all()]

@router.get("/admin/procurement-manifest")
async def get_procurement_manifest(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(Order).options(selectinload(Order.items)).where(Order.status == "PAID"))
    paid_orders = result.scalars().all()
    manifest = {}
    for order in paid_orders:
        for item in order.items:
            key = f"{item.product_name} ({item.product_unit})"
            if key not in manifest:
                manifest[key] = {"product_name": item.product_name, "product_unit": item.product_unit, "total_quantity": 0.0, "orders_count": 0}
            manifest[key]["total_quantity"] += float(item.quantity)
            manifest[key]["orders_count"] += 1
    return list(manifest.values())

@router.get("/admin/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    prod_count = await db.scalar(select(func.count()).select_from(Product).where(Product.active == True))
    from app.models.custom_shopping_list import CustomShoppingList
    quote_count = await db.scalar(select(func.count()).select_from(CustomShoppingList).where(CustomShoppingList.status == "PENDING_QUOTE"))
    active_orders = await db.scalar(select(func.count()).select_from(Order).where(Order.status.in_(["PAID", "DISPATCHED"])))
    revenue = await db.scalar(select(func.sum(Order.total_kobo)).where(Order.status.in_(["PAID", "DISPATCHED", "DELIVERED"])))
    return {"total_products": prod_count or 0, "pending_quotes": quote_count or 0, "active_orders": active_orders or 0, "total_revenue_kobo": revenue or 0}

@router.patch("/admin/{order_id}/force-deliver")
async def force_deliver(order_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require_admin_or_driver)):
    result = await db.execute(select(Order).where(Order.id == order_id).with_for_update())
    order = result.scalar_one_or_none()
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    if order.status == "DELIVERED": raise HTTPException(status_code=400, detail="Order is already delivered")
    
    order.status = "DELIVERED"
    await db.commit()
    return {"status": "success", "message": "Order manually marked as DELIVERED"}

@router.patch("/{order_id}/status")
async def update_order_status(order_id: uuid.UUID, payload: OrderStatusUpdate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    
    if payload.status == "CANCELLED" and order.status != "CANCELLED":
        result = await db.execute(select(Order).options(selectinload(Order.items)).where(Order.id == order_id))
        order_with_items = result.scalar_one()
        for item in order_with_items.items:
            prod_result = await db.execute(select(Product).where(Product.id == item.product_id))
            product = prod_result.scalar_one_or_none()
            if product: product.stock_quantity += int(item.quantity)
    
    order.status = payload.status
    await db.commit()
    return {"status": "success"}

@router.post("/{order_id}/generate-pin")
async def generate_delivery_pin(order_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require_admin_or_driver)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    raw_pin = str(random.randint(1000, 9999))
    hashed = hash_password(raw_pin)
    pin_result = await db.execute(select(PickupPin).where(PickupPin.order_id == order.id))
    existing = pin_result.scalar_one_or_none()
    if existing: existing.pin_hash = hashed; existing.status = "ACTIVE"; existing.attempts = 0
    else: db.add(PickupPin(order_id=order.id, pin_hash=hashed, status="ACTIVE"))
    order.status = "DISPATCHED"
    await db.commit()
    return {"status": "success", "message": f"PIN generated: {raw_pin}", "pin": raw_pin}

@router.post("/{order_id}/verify-pin")
async def verify_delivery_pin(order_id: uuid.UUID, payload: PinVerifyRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db), user: User = Depends(require_admin_or_driver)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    
    pin_result = await db.execute(select(PickupPin).where(PickupPin.order_id == order.id))
    pin_record = pin_result.scalar_one_or_none()
    
    if not pin_record: raise HTTPException(status_code=400, detail="No PIN generated")
    if pin_record.status == "LOCKED": raise HTTPException(status_code=400, detail="PIN is locked")

    if not verify_password(payload.pin, pin_record.pin_hash):
        pin_record.attempts += 1
        if pin_record.attempts >= pin_record.max_attempts: pin_record.status = "LOCKED"
        await db.commit()
        raise HTTPException(status_code=400, detail=f"Invalid PIN. {pin_record.max_attempts - pin_record.attempts} attempts left.")
        
    pin_record.status = "VERIFIED"
    order.status = "DELIVERED"
    await db.commit()

    msg = f"✅ Order #{order.id[:8]} has been successfully DELIVERED."
    background_tasks.add_task(alert_admin, db, "order_delivered", msg, "order", order.id)

    return {"status": "success", "message": "Delivery verified"}