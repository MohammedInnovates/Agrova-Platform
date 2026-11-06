import uuid
from datetime import date, datetime

from sqlalchemy import (
    Date, DateTime, ForeignKey, Index, Integer, String, Text,
    UniqueConstraint, text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class DeliveryRoute(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    A physical truck run within a batch. Spans multiple orders.

    Example:
      Batch 2026-W44 has:
        - Route A: Gwarinpa -> Jabi -> Utako
        - Route B: Kubwa -> Dei-Dei
        - Route C: Lugbe -> Apo (Express orders only)

    Route codes are batch-scoped: "A", "B", "C" reset per batch.
    """
    __tablename__ = "delivery_routes"
    __table_args__ = (
        # Two batches can both have a Route A, but one batch can't have two Route A's
        UniqueConstraint(
            "batch_window_id", "code", name="uq_delivery_routes_batch_code"
        ),
        # Hot query: "get all routes for this batch" (dispatch dashboard)
        Index("ix_delivery_routes_batch_status", "batch_window_id", "status"),
    )

    batch_window_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("batch_windows.id", ondelete="CASCADE"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="PLANNED", server_default="PLANNED"
    )
    scheduled_for: Mapped[date | None] = mapped_column(Date, nullable=True)
    dispatched_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # Denormalized count for fast frontend display ("5 stops on your route")
    total_stops: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )

    # --- Driver & vehicle info (filled by logistics coordinator) ---
    driver_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    driver_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    vehicle_identifier: Mapped[str | None] = mapped_column(
        String(40), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)