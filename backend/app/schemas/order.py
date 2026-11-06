import uuid
from datetime import date
from decimal import Decimal
from pydantic import BaseModel, Field


class CartItemInput(BaseModel):
    product_id: uuid.UUID
    quantity: float = Field(gt=0, description="Quantity in bulk units")
    unit_kind: str = "bulk" # "bulk" or "local"


class OrderCreateInput(BaseModel):
    user_id: uuid.UUID
    items: list[CartItemInput]
    delivery_type: str = "WEEKLY_BATCH"
    fulfillment_method: str = "ESTATE_HUB"
    substitution_preference: str = "AUTO_SUBSTITUTE"
    delivery_estate_id: uuid.UUID | None = None
    delivery_directions: str | None = None


class OrderItemOutput(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    product_brand: str | None
    product_unit: str
    quantity: float
    unit_price_kobo: int
    original_unit_price_kobo: int
    line_subtotal_kobo: int
    line_discount_kobo: int
    line_total_kobo: int
    item_status: str


class OrderResponse(BaseModel):
    id: uuid.UUID
    mode: str
    quantity: Decimal
    subtotal_kobo: int
    discount_kobo: int
    total_kobo: int
    status: str
    batch_window_id: uuid.UUID | None
    delivery_date: date | None
    delivery_type: str
    fulfillment_method: str
    delivery_directions: str | None
    items: list[OrderItemOutput]
    pickup_pin: str | None = None


class OrderStatusUpdate(BaseModel):
    status: str


class PinVerifyRequest(BaseModel):
    pin: str