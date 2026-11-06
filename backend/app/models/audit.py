import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class AuditLog(Base):
    """
    Append-only immutable security log.

    Never updated, never deleted. No TimestampMixin — no updated_at column,
    because rows are frozen the moment they are written.

    Captures:
      - WHO did it (actor_id)
      - WHAT they did (action)
      - WHAT IT AFFECTED (entity + entity_id)
      - DETAILS (meta JSONB)
      - WHEN (created_at)

    Example entries:
      {"action": "product.price_changed", "entity": "product", "meta": {"old": 5700000, "new": 5800000}}
      {"action": "order.refunded", "entity": "order", "meta": {"amount_kobo": 1514500, "reason": "customer complaint"}}
      {"action": "user.role_changed", "entity": "user", "meta": {"old": "customer", "new": "hub_coordinator"}}
    """
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )
    # Who performed the action. NULL for system actions (auto-jobs, webhooks).
    actor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    # Dotted action namespace, e.g. "order.refunded", "product.created"
    action: Mapped[str] = mapped_column(
        String(80), nullable=False, index=True
    )
    # The table this action affected: "order", "product", "user", "wallet"
    entity: Mapped[str] = mapped_column(
        String(80), nullable=False, index=True
    )
    # The specific row ID
    entity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True, index=True
    )
    # Structured extra context (old/new values, reasons, etc.)
    meta: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )