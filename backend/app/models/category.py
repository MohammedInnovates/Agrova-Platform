import uuid
from sqlalchemy import ForeignKey, String, Boolean, Integer, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

class Category(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=text("true"))
    show_on_homepage: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=text("true"))
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=text("0"))

    subcategories: Mapped[list["SubCategory"]] = relationship(back_populates="category", cascade="all, delete-orphan")

class SubCategory(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "subcategories"

    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=text("true"))

    category: Mapped["Category"] = relationship(back_populates="subcategories")