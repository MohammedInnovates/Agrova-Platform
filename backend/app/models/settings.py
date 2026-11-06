from decimal import Decimal
from datetime import datetime
from sqlalchemy import BigInteger, Numeric, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base

class GlobalSettings(Base):
    __tablename__ = "global_settings"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    
    # Delivery Fees (in Kobo)
    delivery_fee_hub_kobo: Mapped[int] = mapped_column(BigInteger, default=50000) # ₦500
    delivery_fee_home_kobo: Mapped[int] = mapped_column(BigInteger, default=300000) # ₦3,000
    express_surcharge_kobo: Mapped[int] = mapped_column(BigInteger, default=500000) # ₦5,000
    monthly_discount_kobo: Mapped[int] = mapped_column(BigInteger, default=20000) # ₦200
    
    # Service Fee (e.g., 0.015 = 1.5%)
    service_fee_percent: Mapped[Decimal] = mapped_column(Numeric(5,4), default=0.0150)
    
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())