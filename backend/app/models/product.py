import uuid
from decimal import Decimal
from sqlalchemy import BigInteger, Boolean, Numeric, SmallInteger, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

class Product(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True) # <-- RESTORED
    
    phase: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    bulk_unit: Mapped[str] = mapped_column(String(80), nullable=False)
    bulk_unit_price_kobo: Mapped[int] = mapped_column(BigInteger, nullable=False)

    local_unit_name: Mapped[str | None] = mapped_column(String(50), nullable=True)
    local_unit_multiplier: Mapped[Decimal | None] = mapped_column(Numeric(10, 4), nullable=True)
    local_unit_kg: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    brand: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    producer: Mapped[str | None] = mapped_column(String(100), nullable=True)
    grade: Mapped[str | None] = mapped_column(String(50), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    stock_quantity: Mapped[int] = mapped_column(nullable=False, default=100, server_default=text("100"))

    supports_bulk_purchase: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=text("true"))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=text("true"))