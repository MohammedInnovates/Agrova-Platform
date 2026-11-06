import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    phone: Mapped[str] = mapped_column(
        String(20), nullable=False, unique=True, index=True
    )
    full_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(
        String(30), nullable=False, default="customer",
        server_default="customer", index=True,
    )
    estate_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("estates.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    # NEW: Default Custom Address (for people not in an estate)
    default_address_directions: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    phone_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class HubCoordinator(TimestampMixin, Base):
    __tablename__ = "hub_coordinators"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    estate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("estates.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    verification_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending", server_default="pending"
    )
    verification_ref: Mapped[str | None] = mapped_column(Text, nullable=True)
    deposit_amount_kobo: Mapped[int] = mapped_column(
        BigInteger, nullable=False, default=0, server_default=text("0")
    )