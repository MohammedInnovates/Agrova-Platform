import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class CustomShoppingList(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    A custom procurement request submitted by a user via text, image, or voice.

    Workflow:
      1. User submits list -> status = PENDING_QUOTE
      2. AI/Admin parses and prices it -> status = QUOTED
      3. User accepts quote -> generates an Order -> status = ACCEPTED
      4. (Or Admin rejects) -> status = REJECTED
    """
    __tablename__ = "custom_shopping_lists"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # The raw request from the user (their original text or transcribed voice)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    # Source of the request: TEXT, IMAGE, AUDIO
    source_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="TEXT", server_default="TEXT"
    )
    # If they uploaded a file, the URL. If voice, the URL. Null for pure text.
    attachment_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- Status: PENDING_QUOTE -> QUOTED -> ACCEPTED / REJECTED ---
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="PENDING_QUOTE",
        server_default="PENDING_QUOTE", index=True,
    )

    # --- AI / Admin pricing ---
    # Parsed items from AI (JSON: [{name, qty, unit, price_kobo}, ...])
    parsed_items: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # Itemized quote total
    quoted_total_kobo: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    # Admin's notes back to the user
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    # When the admin finished quoting
    quoted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # Admin user who generated the quote
    quoted_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # --- Link to the resulting Order once user pays ---
    generated_order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )