from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Supplier(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    A farm hub, farmer, or wholesaler that supplies Agrova.
    Suppliers live in source states: Nasarawa, Niger, Benue, Kaduna,
    or are Abuja-based wholesale distributors.
    """
    __tablename__ = "suppliers"

    name: Mapped[str] = mapped_column(
        String(200), nullable=False, index=True
    )
    # Source state/region: "Nasarawa", "Kaduna", "Abuja Wholesale", etc.
    state_region: Mapped[str | None] = mapped_column(
        String(120), nullable=True
    )
    contact_phone: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    # Reference to their payout account in Paystack/Monnify (for split payouts)
    payout_account_ref: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )