import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime, ForeignKey, Index, Integer, String, Text, text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Notification(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Every outbound message sent to a user (WhatsApp/SMS).

    Key design:
      - `template_key` identifies the message type (e.g. "order_confirmed")
      - `idempotency_key` is UNIQUE — prevents duplicate sends
      - `provider_message_id` lets us track delivery receipts from Meta/Termii
    """
    __tablename__ = "notifications"
    __table_args__ = (
        # Hot query: "recent notifications for this user"
        Index("ix_notifications_user_created", "user_id", "created_at"),
        # Scheduler query: "which messages are due to send?"
        Index("ix_notifications_status_scheduled", "status", "scheduled_for"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    # whatsapp | sms
    channel: Mapped[str] = mapped_column(String(20), nullable=False)
    # order_confirmed | order_dispatched | pickup_pin | quote_ready | etc.
    template_key: Mapped[str] = mapped_column(
        String(80), nullable=False, index=True
    )
    # Template variables: {"order_id": "...", "total": 15145}
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # QUEUED | SENT | DELIVERED | FAILED
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="QUEUED", server_default="QUEUED"
    )
    # Meta | Termii | Twilio
    provider: Mapped[str | None] = mapped_column(String(30), nullable=True)
    # Provider's tracking ID (for delivery receipt lookup)
    provider_message_id: Mapped[str | None] = mapped_column(
        String(120), nullable=True, index=True
    )

    # --- Polymorphic link to the entity that triggered this notification ---
    related_entity: Mapped[str | None] = mapped_column(
        String(40), nullable=True
    )  # "order" | "custom_list" | "wallet"
    related_entity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    # --- Idempotency: ONE notification of this type per entity ---
    # Example: "order_confirmed:<order_id>" — can only be sent once
    idempotency_key: Mapped[str] = mapped_column(
        String(160), nullable=False, unique=True, index=True
    )

    attempts: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    scheduled_for: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    delivered_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    failed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)