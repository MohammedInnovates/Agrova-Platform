import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.custom_shopping_list import CustomShoppingList
from app.models.order import Order
from app.models.user import User
from app.schemas.custom_list import *
from app.services.ai_parser_service import parse_shopping_list
from app.services.payment_service import initialize_payment
from app.services.notification_service import alert_admin
from app.api.deps import require_admin

router = APIRouter()

@router.post("/submit", response_model=CustomListSubmitOutput, status_code=201)
async def submit_list(payload: CustomListSubmitInput, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    user_result = await db.execute(select(User).where(User.id == payload.user_id))
    user = user_result.scalar_one_or_none()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    
    parsed = await parse_shopping_list(db, payload.raw_text)
    parsed_json = {"items": [{"raw_text": i.raw_text, "matched_product_id": str(i.matched_product_id) if i.matched_product_id else None, "product_name": i.product_name, "product_brand": i.product_brand, "product_unit": i.product_unit, "quantity": float(i.quantity), "unit_kind": i.unit_kind, "unit_price_kobo": i.unit_price_kobo, "line_total_kobo": i.line_total_kobo, "confidence": i.confidence, "note": i.note} for i in parsed.items], "unmatched": parsed.unmatched, "estimated_total_kobo": parsed.total_kobo}
    
    cl = CustomShoppingList(user_id=payload.user_id, raw_text=payload.raw_text, source_type=payload.source_type, attachment_url=payload.attachment_url, status="PENDING_QUOTE", parsed_items=parsed_json, quoted_total_kobo=parsed.total_kobo if parsed.items else None)
    db.add(cl)
    await db.commit()
    await db.refresh(cl)

    msg = f"New Custom Quote Request from {user.full_name or user.phone}.\n\nList: {payload.raw_text[:50]}..."
    background_tasks.add_task(alert_admin, db, "new_quote", msg, "custom_list", cl.id)

    return CustomListSubmitOutput(id=cl.id, status=cl.status, items=[ParsedItemPreview(**i) for i in parsed.items], unmatched=parsed.unmatched, estimated_total_kobo=parsed.total_kobo, message=f"Estimated ₦{parsed.total_kobo / 100:,.0f}.")

@router.get("/pending", summary="Admin: list pending quotes")
async def list_pending_lists(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(CustomShoppingList).where(CustomShoppingList.status == "PENDING_QUOTE").order_by(CustomShoppingList.created_at.desc()))
    return [{"id": str(cl.id), "user_id": str(cl.user_id), "raw_text": cl.raw_text, "source_type": cl.source_type, "status": cl.status, "quoted_total_kobo": cl.quoted_total_kobo, "created_at": cl.created_at.isoformat()} for cl in result.scalars().all()]

@router.get("/{list_id}", response_model=CustomListItemOutput)
async def read_list(list_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CustomShoppingList).where(CustomShoppingList.id == list_id))
    cl = result.scalar_one_or_none()
    if not cl: raise HTTPException(status_code=404, detail="Custom list not found")
    return CustomListItemOutput(id=cl.id, user_id=cl.user_id, raw_text=cl.raw_text, source_type=cl.source_type, attachment_url=cl.attachment_url, status=cl.status, parsed_items=cl.parsed_items, quoted_total_kobo=cl.quoted_total_kobo, admin_notes=cl.admin_notes, quoted_at=cl.quoted_at, generated_order_id=cl.generated_order_id, created_at=cl.created_at)

@router.post("/{list_id}/quote", response_model=CustomListItemOutput)
async def quote_list(list_id: uuid.UUID, payload: CustomListQuoteInput, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(CustomShoppingList).where(CustomShoppingList.id == list_id))
    cl = result.scalar_one_or_none()
    if not cl: raise HTTPException(status_code=404, detail="Custom list not found")
    if cl.status != "PENDING_QUOTE": raise HTTPException(status_code=400, detail="List is not pending")
    cl.parsed_items = [item.model_dump() for item in payload.quoted_items]
    cl.quoted_total_kobo = payload.quoted_total_kobo
    cl.admin_notes = payload.admin_notes
    cl.status = "QUOTED"
    cl.quoted_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(cl)
    return CustomListItemOutput(id=cl.id, user_id=cl.user_id, raw_text=cl.raw_text, source_type=cl.source_type, attachment_url=cl.attachment_url, status=cl.status, parsed_items=cl.parsed_items, quoted_total_kobo=cl.quoted_total_kobo, admin_notes=cl.admin_notes, quoted_at=cl.quoted_at, generated_order_id=cl.generated_order_id, created_at=cl.created_at)

@router.post("/{list_id}/accept", response_model=CustomListAcceptOutput)
async def accept_quote(list_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CustomShoppingList).where(CustomShoppingList.id == list_id))
    cl = result.scalar_one_or_none()
    if not cl: raise HTTPException(status_code=404, detail="Custom list not found")
    if cl.status != "QUOTED": raise HTTPException(status_code=400, detail="Must be QUOTED to accept")
    if not cl.quoted_total_kobo: raise HTTPException(status_code=400, detail="Quote total is missing")
    
    order = Order(
        user_id=cl.user_id, mode="CUSTOM_LIST", quantity=1, unit_price_kobo=cl.quoted_total_kobo,
        subtotal_kobo=cl.quoted_total_kobo, discount_kobo=0, service_fee_kobo=0, delivery_fee_kobo=0,
        total_kobo=cl.quoted_total_kobo, delivery_type="WEEKLY_BATCH", fulfillment_method="ESTATE_HUB",
        substitution_preference="CONTACT_ME", status="PENDING_PAYMENT"
    )
    db.add(order)
    await db.flush()
    cl.generated_order_id = order.id
    cl.status = "ACCEPTED"
    await db.commit()
    await db.refresh(order)
    
    auth_url = None
    try:
        res = await initialize_payment(db, order_id=order.id, callback_url="http://localhost:3000/payment/callback")
        auth_url = res.get("authorization_url")
    except HTTPException:
        pass
        
    return CustomListAcceptOutput(order_id=order.id, total_kobo=order.total_kobo, authorization_url=auth_url, message="Order created.")