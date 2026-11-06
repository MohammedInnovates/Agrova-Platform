from sqlalchemy import Boolean, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Zone(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    An Abuja buying zone that groups nearby estates together.
    Example zones:
      - NW (North-West Cluster): Gwarinpa, Jabi, Utako, Wuse
      - SE (South-East Cluster): Lugbe, Apo, Gudu
      - NE (North-East Cluster): Kubwa, Dei-Dei, Dawaki
    """
    __tablename__ = "zones"

    name: Mapped[str] = mapped_column(
        String(120), nullable=False, unique=True, index=True
    )
    code: Mapped[str] = mapped_column(
        String(20), nullable=False, unique=True, index=True
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )