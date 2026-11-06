import uuid
from decimal import Decimal

from sqlalchemy import (
    BigInteger, Boolean, ForeignKey, Index, Numeric, String,
    UniqueConstraint, text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class ProductPriceTier(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Quantity-based discount tiers for a product (bulk orders only).

    Selection rule (enforced by the checkout service):
        SELECT * FROM product_price_tiers
        WHERE product_id = :pid
          AND is_active = true
          AND min_quantity <= :qty
        ORDER BY min_quantity DESC
        LIMIT 1
      -> If no tier matches, fall back to Product.bulk_unit_price_kobo.

    This design is overlap-proof: only the highest min_quantity that is
    <= qty wins, so two tiers can never apply at once.

    Example for "Royal Stallion Rice 50kg":
      Tier A: min_quantity=10, unit_price_kobo=52,000*100 (10+ bags)
      Tier B: min_quantity=5,  unit_price_kobo=55,000*100 (5-9 bags)
      Base price:             57,000*100              (1-4 bags)
    """
    __tablename__ = "product_price_tiers"
    __table_args__ = (
        # One tier per (product, min_quantity) boundary — no duplicates
        UniqueConstraint(
            "product_id",
            "min_quantity",
            name="uq_product_price_tiers_product_min",
        ),
        # Fast tier lookup: WHERE product_id = X AND min_quantity <= Y DESC
        Index(
            "ix_product_price_tiers_product_min",
            "product_id",
            "min_quantity",
        ),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
    )
    min_quantity: Mapped[Decimal] = mapped_column(
        Numeric(precision=12, scale=3), nullable=False
    )
    # Price per bulk unit at this tier, in kobo
    unit_price_kobo: Mapped[int] = mapped_column(BigInteger, nullable=False)
    # Human-facing label shown on the product page: "Bulk 5+", "Wholesale 10+"
    label: Mapped[str | None] = mapped_column(String(80), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )