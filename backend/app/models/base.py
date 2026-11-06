import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """
    The single declarative base for all Agrova models.
    Every table inherits from this.
    """
    pass


class UUIDPrimaryKeyMixin:
    """
    Adds a UUID primary key to a model.
    Generated in Python so it works across any database.
    """
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )


class TimestampMixin:
    """
    Adds created_at and updated_at timestamps to a model.
    - created_at: set automatically by PostgreSQL when row is inserted
    - updated_at: refreshed automatically by PostgreSQL when row is updated
    """
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )