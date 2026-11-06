from typing import List
from decimal import Decimal
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.product import Product
from app.models.user import User
from app.api.deps import require_admin

router = APIRouter()

def serialize_product(p: Product):
    return {
        "id": str(p.id), "name": getattr(p, 'name', ''), "category": getattr(p, 'category', ''),
        "description": getattr(p, 'description', None), "phase": getattr(p, 'phase', 1),
        "bulk_unit": getattr(p, 'bulk_unit', ''), "bulk_unit_price_kobo": getattr(p, 'bulk_unit_price_kobo', 0),
        "local_unit_name": getattr(p, 'local_unit_name', None),
        "local_unit_multiplier": float(p.local_unit_multiplier) if getattr(p, 'local_unit_multiplier', None) else None,
        "local_unit_kg": float(p.local_unit_kg) if getattr(p, 'local_unit_kg', None) else None,
        "brand": getattr(p, 'brand', None), "producer": getattr(p, 'producer', None),
        "grade": getattr(p, 'grade', None), "image_url": getattr(p, 'image_url', None),
        "stock_quantity": getattr(p, 'stock_quantity', 100),
        "supports_bulk_purchase": getattr(p, 'supports_bulk_purchase', True), "active": getattr(p, 'active', True),
    }

class ProductCreateInput(BaseModel):
    name: str; category: str; description: str | None = None; phase: int = 1
    bulk_unit: str; bulk_unit_price_kobo: int
    local_unit_name: str | None = None; local_unit_multiplier: float | None = None; local_unit_kg: float | None = None
    brand: str | None = None; producer: str | None = None; grade: str | None = None
    image_url: str | None = None; stock_quantity: int = 100

class ProductUpdateInput(BaseModel):
    name: str | None = None; category: str | None = None; description: str | None = None
    bulk_unit: str | None = None; bulk_unit_price_kobo: int | None = None
    local_unit_name: str | None = None; local_unit_multiplier: float | None = None; local_unit_kg: float | None = None
    brand: str | None = None; grade: str | None = None; image_url: str | None = None
    stock_quantity: int | None = None; active: bool | None = None

@router.get("/", summary="List products")
async def list_products(
    category: str | None = Query(None), brand: str | None = Query(None), search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Product).where(Product.active == True)
    if category: query = query.where(Product.category == category)
    if brand: query = query.where(Product.brand == brand)
    if search:
        term = f"%{search}%"
        query = query.where(or_(Product.name.ilike(term), Product.brand.ilike(term), Product.category.ilike(term)))
    query = query.order_by(Product.name)
    result = await db.execute(query)
    return [serialize_product(p) for p in result.scalars().all()]

@router.get("/{product_id}", summary="Get a single product")
async def get_product(product_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product: raise HTTPException(status_code=404, detail="Product not found")
    return serialize_product(product)

# --- ADMIN ROUTES (PROTECTED) ---
@router.post("/admin", summary="Admin: create a new product", status_code=201)
async def admin_create_product(payload: ProductCreateInput, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    product = Product(
        name=payload.name, category=payload.category, description=payload.description,
        phase=payload.phase, bulk_unit=payload.bulk_unit, bulk_unit_price_kobo=payload.bulk_unit_price_kobo,
        local_unit_name=payload.local_unit_name,
        local_unit_multiplier=Decimal(str(payload.local_unit_multiplier)) if payload.local_unit_multiplier else None,
        local_unit_kg=Decimal(str(payload.local_unit_kg)) if payload.local_unit_kg else None,
        brand=payload.brand, producer=payload.producer, grade=payload.grade,
        image_url=payload.image_url, stock_quantity=payload.stock_quantity,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return serialize_product(product)

@router.put("/admin/{product_id}", summary="Admin: update a product")
async def admin_update_product(product_id: str, payload: ProductUpdateInput, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product: raise HTTPException(status_code=404, detail="Product not found")

    if payload.name is not None: product.name = payload.name
    if payload.category is not None: product.category = payload.category
    if payload.description is not None: product.description = payload.description
    if payload.bulk_unit is not None: product.bulk_unit = payload.bulk_unit
    if payload.bulk_unit_price_kobo is not None: product.bulk_unit_price_kobo = payload.bulk_unit_price_kobo
    if payload.local_unit_name is not None: product.local_unit_name = payload.local_unit_name
    if payload.local_unit_multiplier is not None: product.local_unit_multiplier = Decimal(str(payload.local_unit_multiplier))
    if payload.local_unit_kg is not None: product.local_unit_kg = Decimal(str(payload.local_unit_kg))
    if payload.brand is not None: product.brand = payload.brand
    if payload.grade is not None: product.grade = payload.grade
    if payload.image_url is not None: product.image_url = payload.image_url
    if payload.stock_quantity is not None: product.stock_quantity = payload.stock_quantity
    if payload.active is not None: product.active = payload.active

    await db.commit()
    await db.refresh(product)
    return serialize_product(product)

@router.delete("/admin/{product_id}", summary="Admin: deactivate a product")
async def admin_deactivate_product(product_id: str, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product: raise HTTPException(status_code=404, detail="Product not found")
    product.active = False
    await db.commit()
    return {"status": "deactivated", "id": str(product.id)}