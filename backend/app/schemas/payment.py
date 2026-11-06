import uuid
from pydantic import BaseModel, HttpUrl


class InitializePaymentInput(BaseModel):
    """Request body for initiating a Paystack payment."""
    order_id: uuid.UUID
    callback_url: str = "http://localhost:3000/payment/callback"


class InitializePaymentOutput(BaseModel):
    """Response with Paystack's authorization URL and reference."""
    authorization_url: str
    access_code: str
    reference: str
    payment_id: uuid.UUID


class PaymentStatusOutput(BaseModel):
    """Status check response for the frontend."""
    payment_id: uuid.UUID
    order_id: uuid.UUID
    status: str
    amount_kobo: int
    provider_ref: str
    order_status: str