import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class PickupPin(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    A secure 4-digit PIN issued per order to verify delivery.

    Security:
      - pin_hash: Argon2 hash of the 4-digit code (NEVER stored plaintext)
      - attempts: max 5 failed tries, then the PIN locks for 15 minutes
      - locked_until: cooldown timestamp if brute-force is detected
    """
    __tablename__ = "pickup_pins"

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # One PIN per order, exactly
        index=True,
    )
    pin_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    # ACTIVE | VERIFIED | EXPIRED | LOCKED
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="ACTIVE",
        server_default="ACTIVE", index=True,
    )

    # --- Brute-force defense ---
    attempts: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    max_attempts: Mapped[int] = mapped_column(
        Integer, nullable=False, default=5, server_default=text("5")
    )
    locked_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # --- Delivery of the PIN to the customer ---
    sent_via: Mapped[str | None] = mapped_column(String(20), nullable=True)  # whatsapp | sms
    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # --- Verification (when the driver enters the PIN) ---
    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    verified_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )