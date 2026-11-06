from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class OTPCode(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    One-time password sent via SMS (Termii) for phone verification.

    - code_hash: Argon2 hash of the 6-digit code (never stored in plaintext)
    - consumed_at: set when successfully used (prevents replay attacks)
    - attempts: counter to prevent brute-force guessing (max 3-5 attempts)
    """
    __tablename__ = "otp_codes"
    __table_args__ = (
        # Composite index for the hot lookup query:
        # "get the latest active OTP for this phone, this purpose"
        Index("ix_otp_codes_phone_purpose", "phone", "purpose"),
    )

    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    code_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    purpose: Mapped[str] = mapped_column(
        String(30), nullable=False, default="login", server_default="login"
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    consumed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    attempts: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )