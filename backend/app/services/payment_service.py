import hashlib
import hmac
import uuid
from datetime import datetime, timezone

import httpx
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.order import Order
from app.models.payment import Payment, WebhookEvent
from app.models.user import User
from app.models.wallet import WalletAccount, WalletTransaction
from app.services.wallet_service import get_or_create_wallet
from app.services.notification_service import alert_admin

settings = get_settings()
PAYSTACK_BASE = "https://api.paystack.co"

# Define BOTH names so nothing breaks
async def initialize_payment(db: AsyncSession, order_id: uuid.UUID, callback_url: str) -> dict:
    return await initialize_paystack_payment(db, order_id, callback_url)

async def initialize_paystack_payment(db: AsyncSession, order_id: uuid.UUID, callback_url: str) -> dict:
    order_result = await db.execute(select(Order).where(Order.id == order_id).with_for_update())
    order = order_result.scalar_one_or_none()
    
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "PENDING_PAYMENT": raise HTTPException(status_code=400, detail=f"Order is in '{order.status}' state")

    existing_payment = await db.execute(
        select(Payment).where(Payment.order_id == order.id).where(Payment.status == "INITIATED").order_by(Payment.created_at.desc())
    )
    existing = existing_payment.scalars().first()
    
    if existing:
        raise HTTPException(status_code=400, detail="A payment link is already active for this order.")

    user_result = await db.execute(select(User).where(User.id == order.user_id))
    user = user_result.scalar_one_or_none()
    
    reference = f"AGROVA-{uuid.uuid4().hex[:16].upper()}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{PAYSTACK_BASE}/transaction/initialize",
            headers={"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}", "Content-Type": "application/json"},
            json={
                "email": f"{user.phone.lstrip('+')}@agrova.ng",
                "amount": order.total_kobo,
                "reference": reference,
                "callback_url": callback_url,
                "metadata": {"order_id": str(order.id), "user_id": str(user.id), "mode": order.mode},
            },
        )

    payload = response.json()
    if not response.is_success or not payload.get("status"):
        raise HTTPException(status_code=502, detail=f"Paystack error: {payload.get('message', 'Unknown')}")

    payment = Payment(
        order_id=order.id, provider="paystack", provider_ref=reference,
        amount_kobo=order.total_kobo, status="INITIATED"
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    return {"authorization_url": payload["data"]["authorization_url"], "access_code": payload["data"]["access_code"], "reference": reference, "payment_id": payment.id}

async def initialize_wallet_topup(db: AsyncSession, user_id: uuid.UUID, amount_kobo: int, callback_url: str) -> dict:
    wallet = await get_or_create_wallet(db, user_id)
    
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user: raise HTTPException(status_code=404, detail="User not found")

    reference = f"AGROVA-WALLET-{uuid.uuid4().hex[:12].upper()}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{PAYSTACK_BASE}/transaction/initialize",
            headers={"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}", "Content-Type": "application/json"},
            json={
                "email": f"{user.phone.lstrip('+')}@agrova.ng",
                "amount": amount_kobo,
                "reference": reference,
                "callback_url": callback_url,
                "metadata": {"type": "wallet_topup", "user_id": str(user.id), "wallet_id": str(wallet.id)},
            },
        )

    payload = response.json()
    if not response.is_success or not payload.get("status"):
        raise HTTPException(status_code=502, detail=f"Paystack error: {payload.get('message')}")

    payment = Payment(
        order_id=None, wallet_id=wallet.id, provider="paystack", 
        provider_ref=reference, amount_kobo=amount_kobo, status="INITIATED"
    )
    db.add(payment)
    await db.commit()

    return {"authorization_url": payload["data"]["authorization_url"], "access_code": payload["data"]["access_code"], "reference": reference}

def verify_webhook_signature(raw_body: bytes, signature: str) -> bool:
    if not signature: return False
    expected = hmac.new(settings.PAYSTACK_SECRET_KEY.encode("utf-8"), raw_body, hashlib.sha512).hexdigest()
    return hmac.compare_digest(expected, signature)

async def process_webhook(db: AsyncSession, payload: dict) -> dict:
    event_type = payload.get("event")
    data = payload.get("data", {})
    event_id = str(data.get("id", ""))
    reference = data.get("reference")

    if event_id:
        existing = await db.execute(select(WebhookEvent).where(WebhookEvent.provider == "paystack", WebhookEvent.event_id == event_id))
        if existing.scalar_one_or_none(): return {"status": "ignored", "reason": "duplicate"}
        db.add(WebhookEvent(provider="paystack", event_id=event_id, event_type=event_type or "unknown", payload=payload, processing_started_at=datetime.now(timezone.utc)))
        await db.flush()

    if not reference:
        await db.commit()
        return {"status": "ignored", "reason": "no_reference"}

    payment_result = await db.execute(select(Payment).where(Payment.provider_ref == reference).with_for_update())
    payment = payment_result.scalar_one_or_none()
    if not payment:
        await db.commit()
        return {"status": "ignored", "reason": "payment_not_found"}

    if event_type == "charge.success":
        if payment.status == "SUCCESS":
            await db.commit()
            return {"status": "ignored", "reason": "already_success"}

        payment.status = "SUCCESS"
        payment.raw_webhook = payload

        if payment.wallet_id:
            w_result = await db.execute(select(WalletAccount).where(WalletAccount.id == payment.wallet_id).with_for_update())
            wallet = w_result.scalar_one_or_none()
            if wallet:
                wallet.balance_kobo += payment.amount_kobo
                db.add(WalletTransaction(
                    wallet_id=wallet.id, direction="CREDIT", amount_kobo=payment.amount_kobo,
                    balance_after_kobo=wallet.balance_kobo, reason="TOPUP", status="COMPLETED",
                    reference=f"topup:{payment.provider_ref}", related_payment_id=payment.id
                ))
        elif payment.order_id:
            o_result = await db.execute(select(Order).where(Order.id == payment.order_id).with_for_update())
            order = o_result.scalar_one_or_none()
            if order and order.status == "PENDING_PAYMENT":
                order.status = "PAID"
                msg = f"💰 Card Payment! Order #{order.id[:8]} paid via Paystack for ₦{order.total_kobo/100:,.0f}."
                await alert_admin(db, "order_paid_card", msg, "order", order.id)

        await db.commit()
        return {"status": "processed", "event": event_type}

    await db.commit()
    return {"status": "ignored", "reason": f"unhandled:{event_type}"}

async def get_payment_status(db: AsyncSession, payment_id: uuid.UUID) -> dict:
    payment_result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = payment_result.scalar_one_or_none()
    if not payment: raise HTTPException(status_code=404, detail="Payment not found")
    order_result = await db.execute(select(Order).where(Order.id == payment.order_id)) if payment.order_id else None
    order = order_result.scalar_one_or_none() if order_result else None

    return {
        "payment_id": payment.id, "order_id": payment.order_id, "status": payment.status,
        "amount_kobo": payment.amount_kobo, "provider_ref": payment.provider_ref,
        "order_status": order.status if order else "N/A",
    }