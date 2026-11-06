import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SupplierPriceHistory(Base):
    """
    Append-only log of supplier/farm-gate price observations.

    Sources:
      - WHATSAPP_AI     : Admin WhatsApp bot asked supplier "What's today's price?" and got a reply
      - MANUAL_ADMIN    : Admin typed it into the dashboard
      - FIELD_AGENT     : Sourcing officer on the ground reported it
      - SUPPLIER_API    : Automated pull from a supplier's system (future)

    Used by:
      - Admin Inflation Tracker dashboard (price trend charts)
      - Auto-alerts: "Rice +15% this week — review catalog prices?"
    """
    __tablename__ = "supplier_price_history"
    __table_args__ = (
        # Hot query: "latest price for this supplier x product"
        Index(
            "ix_supplier_price_history_supplier_product",
            "supplier_id",
            "product_id",
            "recorded_at",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )
    supplier_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("suppliers.id", ondelete="CASCADE"),
        nullable=False,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )
    # Farm-gate price reported by supplier, in kobo per bulk unit
    price_kobo: Mapped[int] = mapped_column(BigInteger, nullable=False)

    # Source of the observation
    source: Mapped[str] = mapped_column(
        String(50), nullable=False, default="MANUAL_ADMIN",
        server_default="MANUAL_ADMIN",
    )
    # If captured via WhatsApp, the raw message text for audit
    raw_message: Mapped[str | None] = mapped_column(String(500), nullable=True)

    notes: Mapped[str | None] = mapped_column(String(255), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )