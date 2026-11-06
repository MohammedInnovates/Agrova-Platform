import uuid
from datetime import date, timedelta
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.batch_window import BatchWindow
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreateInput
from app.services.pricing_service import price_order


async def create_order(db: AsyncSession, order_input: OrderCreateInput) -> Order:
    """
    Full checkout flow:
      1. Validate user
      2. Determine batch window (scheduled only) + delivery date
      3. Price the cart (via pricing_service)
      4. Check stock and deduct it
      5. Calculate extra weight-based delivery fee
      6. Insert Order row
      7. Insert OrderItem rows
      8. Return the Order with line items eagerly loaded
    """
    # --- 1. Validate user ---
    user_result = await db.execute(
        select(User).where(User.id == order_input.user_id)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"User {order_input.user_id} not found",
        )

    # --- 2. Resolve batch window & delivery date ---
    batch_window_id, delivery_date = await _resolve_delivery_schedule(
        db, order_input.delivery_type
    )

    # --- 3. Price the cart ---
    priced = await price_order(db, order_input)

    # --- SAFETY GUARD: prevent divide-by-zero ---
    if priced.total_quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Cart total is zero. Please add items to your cart.",
        )

    qty_divisor = max(int(priced.total_quantity), 1)
    weighted_unit_price = priced.subtotal_kobo // qty_divisor

    # --- 4. CHECK STOCK AND DEDUCT IT + Calculate Weight ---
    total_weight_kg = 0.0
    for line in priced.lines:
        prod_result = await db.execute(
            select(Product).where(Product.id == line.product_id).with_for_update()
        )
        product = prod_result.scalar_one()

        if product.stock_quantity < line.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough stock for {product.name}. Only {product.stock_quantity} {product.bulk_unit} left.",
            )

        # Deduct the stock
        product.stock_quantity -= int(line.quantity)

        # Calculate weight for delivery fee
        if product.local_unit_kg and product.local_unit_multiplier:
            single_item_weight = float(product.local_unit_kg) / float(product.local_unit_multiplier)
            total_weight_kg += single_item_weight * float(line.quantity)
        else:
            total_weight_kg += 50.0 * float(line.quantity)  # Default to 50kg

    # --- 5. Calculate extra weight-based delivery fee (for HOME DELIVERY only) ---
    extra_weight_fee = 0
    if order_input.fulfillment_method == "HOME_DELIVERY" and total_weight_kg > 50:
        # Charge ₦200 for every additional 10kg over 50kg
        extra_weight = total_weight_kg - 50
        extra_weight_fee = int((extra_weight / 10) * 20000)  # 20,000 kobo = ₦200

    final_delivery_fee = priced.delivery_fee_kobo + extra_weight_fee
    final_total_kobo = (
        priced.subtotal_kobo
        - priced.discount_kobo
        + priced.service_fee_kobo
        + final_delivery_fee
    )

    # --- 6. Insert the Order row ---
    order = Order(
        user_id=user.id,
        mode="DIRECT_CART",
        quantity=priced.total_quantity,
        unit_price_kobo=weighted_unit_price,
        subtotal_kobo=priced.subtotal_kobo,
        discount_kobo=priced.discount_kobo,
        service_fee_kobo=priced.service_fee_kobo,
        delivery_fee_kobo=final_delivery_fee,
        total_kobo=final_total_kobo,
        delivery_type=order_input.delivery_type,
        fulfillment_method=order_input.fulfillment_method,
        substitution_preference=order_input.substitution_preference,
        delivery_estate_id=order_input.delivery_estate_id or user.estate_id,
        delivery_directions=order_input.delivery_directions,
        status="PENDING_PAYMENT",
        batch_window_id=batch_window_id,
        delivery_date=delivery_date,
    )
    db.add(order)
    await db.flush()

    # --- 7. Insert OrderItem rows ---
    for line in priced.lines:
        item = OrderItem(
            order_id=order.id,
            product_id=line.product_id,
            product_name=line.product_name,
            product_brand=line.product_brand,
            product_unit=line.product_unit,
            quantity=line.quantity,
            unit_price_kobo=line.unit_price_kobo,
            original_unit_price_kobo=line.original_unit_price_kobo,
            line_subtotal_kobo=line.line_subtotal_kobo,
            line_discount_kobo=line.line_discount_kobo,
            line_total_kobo=line.line_total_kobo,
            applied_tier_id=line.applied_tier_id,
            item_status="PENDING",
        )
        db.add(item)

    await db.commit()

    # --- 8. Reload with line items eagerly ---
    stmt = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order.id)
    )
    result = await db.execute(stmt)
    return result.scalar_one()


async def get_order(db: AsyncSession, order_id: uuid.UUID) -> Order:
    """Fetch an order with all its line items."""
    stmt = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=404,
            detail=f"Order {order_id} not found",
        )
    return order


# ============================================================
# --- Private helpers ---
# ============================================================

async def _resolve_delivery_schedule(
    db: AsyncSession, delivery_type: str
) -> tuple[uuid.UUID | None, date | None]:
    """
    Scheduled orders must belong to a batch window.
    Express orders get batch_window_id = None and delivery_date = tomorrow.
    """
    if delivery_type == "EXPRESS_URGENT":
        return None, date.today() + timedelta(days=1)

    result = await db.execute(
        select(BatchWindow)
        .where(BatchWindow.status == "SCHEDULED")
        .order_by(BatchWindow.cutoff_at.asc())
        .limit(1)
    )
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(
            status_code=400,
            detail=f"No active {delivery_type} batch window found. Please try Express delivery or contact support.",
        )
    return batch.id, batch.delivery_date