import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import (
    BigInteger, Date, ForeignKey, Numeric, String, Text, text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Order(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "orders"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    mode: Mapped[str] = mapped_column(
        String(20), nullable=False, default="DIRECT_CART",
        server_default="DIRECT_CART",
    )

    quantity: Mapped[Decimal] = mapped_column(
        Numeric(precision=12, scale=3), nullable=False
    )
    unit_price_kobo: Mapped[int] = mapped_column(BigInteger, nullable=False)
    subtotal_kobo: Mapped[int] = mapped_column(BigInteger, nullable=False)
    discount_kobo: Mapped[int] = mapped_column(
        BigInteger, nullable=False, default=0, server_default=text("0")
    )
    service_fee_kobo: Mapped[int] = mapped_column(
        BigInteger, nullable=False, default=0, server_default=text("0")
    )
    delivery_fee_kobo: Mapped[int] = mapped_column(
        BigInteger, nullable=False, default=0, server_default=text("0")
    )
    total_kobo: Mapped[int] = mapped_column(BigInteger, nullable=False)

    delivery_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="WEEKLY_BATCH",
        server_default="WEEKLY_BATCH",
    )
    fulfillment_method: Mapped[str] = mapped_column(
        String(20), nullable=False, default="ESTATE_HUB",
        server_default="ESTATE_HUB",
    )
    substitution_preference: Mapped[str] = mapped_column(
        String(30), nullable=False, default="AUTO_SUBSTITUTE",
        server_default="AUTO_SUBSTITUTE",
    )

    delivery_estate_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("estates.id", ondelete="SET NULL"),
        nullable=True,
    )
    delivery_directions: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="PENDING_PAYMENT",
        server_default="PENDING_PAYMENT", index=True,
    )
    batch_window_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("batch_windows.id", ondelete="RESTRICT"),
        nullable=True, index=True,
    )
    delivery_date: Mapped[date | None] = mapped_column(
        Date, nullable=True, index=True
    )

    delivery_route_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("delivery_routes.id", ondelete="SET NULL"),
        nullable=True, index=True,
    )
    delivery_status: Mapped[str | None] = mapped_column(String(30), nullable=True)

    # --- RELATIONSHIPS ADDED HERE ---
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", lazy="selectin",
    )
    user: Mapped["User"] = relationship(lazy="joined")
    estate: Mapped["Estate"] = relationship(lazy="joined")