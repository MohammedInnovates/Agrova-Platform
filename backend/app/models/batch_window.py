from datetime import date, datetime

from sqlalchemy import Date, DateTime, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class BatchWindow(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    A scheduled procurement and delivery cycle.

    Examples:
      - Weekly batch: cutoff Thursday 23:59, delivery Saturday
      - Monthly batch: cutoff last Wednesday, delivery first Saturday of next month

    Lifecycle:
      SCHEDULED        -> accepting orders; cutoff_at is in the future
      CUTOFF_REACHED   -> cutoff just fired; batch is being finalized
      LOCKED           -> all orders locked, Purchase Orders generated
      DISPATCHING      -> trucks dispatched from the warehouse
      DELIVERED        -> all hub handovers confirmed
      COMPLETED        -> all pickups confirmed, batch archived
    """
    __tablename__ = "batch_windows"
    __table_args__ = (
        # Hot query: "what's the current active batch?" (status + cutoff)
        Index("ix_batch_windows_status_cutoff", "status", "cutoff_at"),
        # Reporting query: "show all batches delivering this Saturday"
        Index("ix_batch_windows_delivery_date", "delivery_date"),
    )

    # Human-readable code, e.g. "2026-W44" for weekly, "2026-M10" for monthly
    code: Mapped[str] = mapped_column(
        String(20), nullable=False, unique=True, index=True
    )
    # The moment the batch stops accepting new orders (UTC)
    cutoff_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    # The physical delivery day for all orders in this batch
    delivery_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="SCHEDULED",
        server_default="SCHEDULED",
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    # When the cutoff job actually ran (audit trail for ops)
    cutoff_processed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # When the batch was locked (all orders frozen)
    locked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )