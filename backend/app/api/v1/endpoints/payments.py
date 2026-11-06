import uuid
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
import hmac
import hashlib

from app.core.config import get_settings
from app.core.database import get_db
from app.services.payment_service import initialize_paystack_payment, process_webhook
from app.models.payment import WebhookEvent

settings = get_settings()
router = APIRouter()

class InitiatePaymentRequest(BaseModel):
    order_id: uuid.UUID
    callback_url: str = "http://localhost:3000/payment/callback"

@router.post("/initialize", summary="Initialize a Paystack transaction")
async def initialize_payment_route(req: InitiatePaymentRequest, db: AsyncSession = Depends(get_db)):
    return await initialize_paystack_payment(db, req.order_id, req.callback_url)

@router.post("/webhook", summary="Paystack Webhook")
async def paystack_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    raw_body = await request.body()
    signature = request.headers.get("x-paystack-signature")
    
    if not signature:
        raise HTTPException(status_code=401, detail="Missing signature.")
        
    expected = hmac.new(
        settings.PAYSTACK_SECRET_KEY.encode("utf-8"),
        raw_body,
        hashlib.sha512
    ).hexdigest()
    
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=401, detail="Invalid signature.")
    
    payload = await request.json()
    
    try:
        await process_webhook(db, payload)
    except Exception as e:
        print(f"⚠️ Webhook processing error: {e}")

    return {"status": "ok"}