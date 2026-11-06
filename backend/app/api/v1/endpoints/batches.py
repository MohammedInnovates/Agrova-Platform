from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.batch_window import BatchWindow
from app.models.user import User
from app.api.deps import require_admin

router = APIRouter()

class BatchCreateInput(BaseModel):
    code: str
    cutoff_date: date
    delivery_date: date

@router.get("/admin/all", summary="Admin: List all batches")
async def list_batches(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(BatchWindow).order_by(BatchWindow.cutoff_at.desc()))
    batches = result.scalars().all()
    return [
        {
            "id": str(b.id),
            "code": b.code,
            "cutoff_at": b.cutoff_at.isoformat(),
            "delivery_date": b.delivery_date.isoformat(),
            "status": b.status
        } for b in batches
    ]

@router.post("/admin", summary="Admin: Create a new batch", status_code=201)
async def create_batch(payload: BatchCreateInput, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    # Check if code exists
    existing = await db.execute(select(BatchWindow).where(BatchWindow.code == payload.code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Batch code already exists")

    # Set cutoff time to 11:59 PM on the cutoff date
    cutoff_datetime = datetime.combine(payload.cutoff_date, datetime.min.time()).replace(hour=23, minute=59)

    new_batch = BatchWindow(
        code=payload.code,
        cutoff_at=cutoff_datetime,
        delivery_date=payload.delivery_date,
        status="SCHEDULED"
    )
    db.add(new_batch)
    await db.commit()
    return {"status": "success", "id": str(new_batch.id)}

@router.patch("/admin/{batch_id}/close", summary="Admin: Force close a batch")
async def close_batch(batch_id: str, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(BatchWindow).where(BatchWindow.id == batch_id))
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    batch.status = "LOCKED"
    await db.commit()
    return {"status": "success", "message": "Batch locked"}