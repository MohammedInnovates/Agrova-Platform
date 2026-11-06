from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.order import Order
from app.models.user import User
from app.api.deps import require_driver

router = APIRouter()

@router.get("/all", summary="Driver: List assigned orders")
async def get_driver_orders(db: AsyncSession = Depends(get_db), current_user: User = Depends(require_driver)):
    """
    Returns orders that are ready for delivery (PROCURED or DISPATCHED).
    """
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.status.in_(["PROCURED", "DISPATCHED"]))
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    
    # Simple serialization
    return [
        {
            "id": str(o.id),
            "status": o.status,
            "total_kobo": o.total_kobo,
            "customer_name": o.user.full_name if o.user else "Customer",
            "customer_phone": o.user.phone if o.user else "Unknown",
            "estate_name": o.estate.name if o.estate else "Custom Address",
            "delivery_directions": o.delivery_directions,
            "items": [
                {
                    "id": str(i.id),
                    "product_name": i.product_name,
                    "quantity": float(i.quantity),
                    "product_unit": i.product_unit,
                } for i in o.items
            ]
        }
        for o in orders
    ]