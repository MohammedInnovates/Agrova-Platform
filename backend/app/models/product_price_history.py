import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ProductPriceHistory(Base):
    """
    Append-only audit trail of every product price change.

    Immutable by design:
      - No TimestampMixin (no updated_at — rows are never modified)
      - Only created_at, set by the database on INSERT
      - Uses BIGSERIAL primary key (cheap, high-volume, never externally referenced)

    Used by:
      - Admin Inflation Tracker (chart price trends over time)
      - Audit log (who changed what price, when, and why)
      - Reporting (price elasticity analysis)
    """
    __tablename__ = "product_price_history"

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    old_price_kobo: Mapped[int] = mapped_column(BigInteger, nullable=False)
    new_price_kobo: Mapped[int] = mapped_column(BigInteger, nullable=False)
    # Admin user who made the change (NULL for automated system changes)
    changed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    # Human-readable reason: "Farm price increase", "Q3 promo", etc.
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )