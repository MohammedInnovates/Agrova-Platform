import uuid

from sqlalchemy import Boolean, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Estate(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    A specific residential estate or neighbourhood within a zone.
    Example estates:
      - "Gwarinpa Estate" (Zone: NW)
      - "Jabi Lake Estate" (Zone: NW)
      - "Lugbe Phase 1" (Zone: SE)
    """
    __tablename__ = "estates"

    # Every estate belongs to exactly one zone. Cannot be deleted if estates exist.
    zone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("zones.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(120), nullable=False, unique=True, index=True
    )
    area: Mapped[str] = mapped_column(
        String(120), nullable=False, index=True
    )
    direction_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )