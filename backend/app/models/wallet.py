import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger, Boolean, DateTime, ForeignKey, Index,
    String, Text, text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class WalletAccount(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    One wallet per user. Balance is a denormalized cache of the ledger.
    
    The source of truth is wallet_transactions. This balance_kobo is a
    fast-read cache that is recomputed by a nightly reconciliation job.
    If they ever drift, the ledger wins.
    """
    __tablename__ = "wallet_accounts"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    balance_kobo: Mapped[int] = mapped_column(
        BigInteger, nullable=False, default=0, server_default=text("0")
    )
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="NGN", server_default="NGN"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )


class WalletTransaction(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Append-only ledger of every wallet movement.
    
    Idempotency is guaranteed by the UNIQUE constraint on `reference`.
    A refund can only happen ONCE per order, no matter how many times
    the code path is triggered.
    """
    __tablename__ = "wallet_transactions"
    __table_args__ = (
        Index(
            "ix_wallet_transactions_wallet_created", "wallet_id", "created_at"
        ),
    )

    wallet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("wallet_accounts.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # CREDIT (money in) | DEBIT (money out)
    direction: Mapped[str] = mapped_column(String(10), nullable=False)
    amount_kobo: Mapped[int] = mapped_column(BigInteger, nullable=False)
    # Snapshot of the balance AFTER this transaction (for audit)
    balance_after_kobo: Mapped[int] = mapped_column(BigInteger, nullable=False)

    # REFUND | ORDER_PAYMENT | WITHDRAWAL | ADJUSTMENT | TOPUP
    reason: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    # PENDING | COMPLETED | FAILED
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="PENDING",
        server_default="PENDING", index=True,
    )
    narration: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Idempotency key — e.g. "refund:order:<uuid>" or "withdraw:<uuid>"
    # Once used, this reference CANNOT be reused (duplicate refund prevention)
    reference: Mapped[str] = mapped_column(
        String(120), nullable=False, unique=True, index=True
    )

    # --- Polymorphic links to whatever triggered this transaction ---
    related_order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
    )
    related_payment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("payments.id", ondelete="SET NULL"),
        nullable=True,
    )

    # --- Withdrawal-specific (only populated for reason = WITHDRAWAL) ---
    bank_account_ref: Mapped[str | None] = mapped_column(Text, nullable=True)
    provider_transfer_ref: Mapped[str | None] = mapped_column(
        String(120), nullable=True, index=True
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    failed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)