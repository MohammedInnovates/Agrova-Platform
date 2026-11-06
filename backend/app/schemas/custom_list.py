import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class CustomListSubmitInput(BaseModel):
    """Payload for submitting a raw shopping list."""
    user_id: uuid.UUID
    raw_text: str = Field(min_length=3, max_length=5000)
    source_type: Literal["TEXT", "IMAGE", "AUDIO"] = "TEXT"
    attachment_url: str | None = Field(default=None, max_length=500)


class ParsedItemPreview(BaseModel):
    """A single parsed item returned in the submit response."""
    raw_text: str
    matched_product_id: uuid.UUID | None
    product_name: str | None
    product_brand: str | None
    product_unit: str | None
    quantity: float
    unit_kind: str
    unit_price_kobo: int
    line_total_kobo: int
    confidence: float
    note: str | None


class CustomListSubmitOutput(BaseModel):
    """Response after submitting a raw list — shows the instant AI quote."""
    id: uuid.UUID
    status: str
    items: list[ParsedItemPreview]
    unmatched: list[str]
    estimated_total_kobo: int
    message: str


class QuotedItem(BaseModel):
    """A single line item in an admin quote."""
    name: str
    qty: float
    unit: str
    price_kobo: int


class CustomListQuoteInput(BaseModel):
    """Admin's itemized quote for a custom list."""
    quoted_items: list[QuotedItem]
    quoted_total_kobo: int = Field(gt=0)
    admin_notes: str | None = Field(default=None, max_length=1000)


class CustomListItemOutput(BaseModel):
    """Full custom list detail (for both customer and admin views)."""
    id: uuid.UUID
    user_id: uuid.UUID
    raw_text: str
    source_type: str
    attachment_url: str | None
    status: str
    parsed_items: dict | list | None
    quoted_total_kobo: int | None
    admin_notes: str | None
    quoted_at: datetime | None
    generated_order_id: uuid.UUID | None
    created_at: datetime


class CustomListAcceptOutput(BaseModel):
    """Response after user accepts a quote — returns payment URL."""
    order_id: uuid.UUID
    total_kobo: int
    authorization_url: str | None
    message: str