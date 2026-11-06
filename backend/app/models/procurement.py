import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger, Date, DateTime, ForeignKey, Numeric, String, Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class PurchaseOrder(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    A master procurement order sent to a supplier for a batch.
    One PO per (supplier, batch) — consolidates all product lines needed.
    """
    __tablename__ = "purchase_orders"
    __table_args__ = (
        UniqueConstraint(
            "supplier_id",
            "batch_window_id",
            name="uq_purchase_orders_supplier_batch",
        ),
    )

    supplier_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("suppliers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    batch_window_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("batch_windows.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="DRAFT", server_default="DRAFT"
    )
    total_kobo: Mapped[int] = mapped_column(BigInteger, nullable=False)
    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    received_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class POLine(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    A single product line inside a Purchase Order.
    Example: PO #1 (Nasarawa Farms) has:
        - 50 bags of Royal Stallion Rice @ ₦52,000
        - 20 bags of Local Beans @ ₦70,000
    """
    __tablename__ = "po_lines"

    po_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("purchase_orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
    )
    quantity: Mapped[Decimal] = mapped_column(
        Numeric(precision=12, scale=3), nullable=False
    )
    unit_cost_kobo: Mapped[int] = mapped_column(BigInteger, nullable=False)
    line_total_kobo: Mapped[int] = mapped_column(BigInteger, nullable=False)


class Delivery(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Hub-level handover confirmation.
    One row per (route, estate) pair. When the truck arrives at Gwarinpa hub,
    the coordinator signs off here, confirming they received the goods.
    """
    __tablename__ = "deliveries"

    batch_window_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("batch_windows.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    delivery_route_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("delivery_routes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    estate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("estates.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    # SCHEDULED | IN_TRANSIT | AT_HUB | CONFIRMED
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="SCHEDULED", server_default="SCHEDULED"
    )
    scheduled_for: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Hub coordinator confirms receipt
    confirmed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)