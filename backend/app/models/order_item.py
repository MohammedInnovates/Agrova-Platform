import uuid
from decimal import Decimal

from sqlalchemy import BigInteger, ForeignKey, Numeric, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class OrderItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A single line item inside an order."""
    __tablename__ = "order_items"

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    product_name: Mapped[str] = mapped_column(String(200), nullable=False)
    product_brand: Mapped[str | None] = mapped_column(String(100), nullable=True)
    product_unit: Mapped[str] = mapped_column(String(80), nullable=False)

    quantity: Mapped[Decimal] = mapped_column(
        Numeric(precision=12, scale=3), nullable=False
    )
    unit_price_kobo: Mapped[int] = mapped_column(BigInteger, nullable=False)
    original_unit_price_kobo: Mapped[int] = mapped_column(
        BigInteger, nullable=False
    )

    line_subtotal_kobo: Mapped[int] = mapped_column(BigInteger, nullable=False)
    line_discount_kobo: Mapped[int] = mapped_column(
        BigInteger, nullable=False, default=0, server_default=text("0")
    )
    line_total_kobo: Mapped[int] = mapped_column(BigInteger, nullable=False)

    applied_tier_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_price_tiers.id", ondelete="SET NULL"),
        nullable=True,
    )

    item_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="PENDING", server_default="PENDING"
    )
    substitution_note: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # --- Back-reference to the parent order ---
    order: Mapped["Order"] = relationship(back_populates="items")