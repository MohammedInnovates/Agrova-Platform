from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.estate import Estate

router = APIRouter()

@router.get("/", summary="List all active estates")
async def list_estates(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Estate).where(Estate.active == True).order_by(Estate.name)
    )
    estates = result.scalars().all()
    
    return [
        {
            "id": str(e.id),
            "name": e.name,
            "area": e.area,
        }
        for e in estates
    ]