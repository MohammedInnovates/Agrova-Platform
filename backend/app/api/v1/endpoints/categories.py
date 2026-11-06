from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.category import Category, SubCategory
from app.models.user import User
from app.api.deps import require_admin

router = APIRouter()

class SubCategoryInput(BaseModel):
    name: str; slug: str; description: str | None = None

class CategoryInput(BaseModel):
    name: str; slug: str; description: str | None = None; image_url: str | None = None
    show_on_homepage: bool = True; display_order: int = 0
    subcategories: List[SubCategoryInput] = []

@router.get("/")
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Category).options(selectinload(Category.subcategories))
        .where(Category.is_active == True).order_by(Category.display_order.asc(), Category.name.asc())
    )
    categories = result.scalars().all()
    return [
        {
            "id": str(c.id), "name": c.name, "slug": c.slug, "description": c.description,
            "image_url": c.image_url, "show_on_homepage": c.show_on_homepage, "display_order": c.display_order,
            "subcategories": [{"id": str(sc.id), "name": sc.name, "slug": sc.slug} for sc in c.subcategories if sc.is_active]
        } for c in categories
    ]

@router.get("/{slug}")
async def get_category_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).options(selectinload(Category.subcategories)).where(Category.slug == slug, Category.is_active == True))
    cat = result.scalar_one_or_none()
    if not cat: raise HTTPException(status_code=404, detail="Category not found")
    products_result = await db.execute(select(Product).where(Product.category == cat.name, Product.active == True))
    products = products_result.scalars().all()
    return {
        "id": str(cat.id), "name": cat.name, "slug": cat.slug, "description": cat.description,
        "image_url": cat.image_url,
        "subcategories": [{"id": str(sc.id), "name": sc.name, "slug": sc.slug} for sc in cat.subcategories],
        "products": [{"id": str(p.id), "name": p.name, "brand": p.brand, "bulk_unit": p.bulk_unit, "bulk_unit_price_kobo": p.bulk_unit_price_kobo, "image_url": p.image_url, "category": p.category} for p in products]
    }

# --- ADMIN ROUTES (PROTECTED) ---
@router.post("/admin", status_code=201)
async def create_category(payload: CategoryInput, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    existing = await db.execute(select(Category).where(Category.name == payload.name))
    if existing.scalar_one_or_none(): raise HTTPException(status_code=400, detail="Category already exists")
    cat = Category(name=payload.name, slug=payload.slug, description=payload.description, image_url=payload.image_url, show_on_homepage=payload.show_on_homepage, display_order=payload.display_order)
    db.add(cat)
    await db.flush()
    for sc in payload.subcategories:
        db.add(SubCategory(category_id=cat.id, name=sc.name, slug=sc.slug, description=sc.description))
    await db.commit()
    return {"status": "success", "id": str(cat.id)}

@router.put("/admin/{category_id}")
async def update_category(category_id: uuid.UUID, payload: CategoryInput, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(Category).where(Category.id == category_id))
    cat = result.scalar_one_or_none()
    if not cat: raise HTTPException(status_code=404, detail="Category not found")
    cat.name = payload.name; cat.slug = payload.slug; cat.description = payload.description
    cat.image_url = payload.image_url; cat.show_on_homepage = payload.show_on_homepage; cat.display_order = payload.display_order
    await db.commit()
    return {"status": "updated"}

@router.delete("/admin/{category_id}")
async def delete_category(category_id: uuid.UUID, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(Category).where(Category.id == category_id))
    cat = result.scalar_one_or_none()
    if not cat: raise HTTPException(status_code=404, detail="Category not found")
    cat.is_active = False; cat.show_on_homepage = False
    await db.commit()
    return {"status": "deactivated"}