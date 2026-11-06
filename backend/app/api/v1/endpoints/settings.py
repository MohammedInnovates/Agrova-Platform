from decimal import Decimal
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.settings import GlobalSettings
from app.models.user import User
from app.api.deps import require_admin

router = APIRouter()

class SettingsUpdateInput(BaseModel):
    delivery_fee_hub_kobo: int
    delivery_fee_home_kobo: int
    express_surcharge_kobo: int
    monthly_discount_kobo: int
    service_fee_percent: float

@router.get("/admin")
async def get_settings(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(GlobalSettings).limit(1))
    config = result.scalar_one_or_none()
    if not config:
        config = GlobalSettings()
        db.add(config)
        await db.commit()
        await db.refresh(config)
    
    return {
        "delivery_fee_hub_kobo": config.delivery_fee_hub_kobo,
        "delivery_fee_home_kobo": config.delivery_fee_home_kobo,
        "express_surcharge_kobo": config.express_surcharge_kobo,
        "monthly_discount_kobo": config.monthly_discount_kobo,
        "service_fee_percent": float(config.service_fee_percent)
    }

@router.put("/admin")
async def update_settings(payload: SettingsUpdateInput, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(GlobalSettings).limit(1))
    config = result.scalar_one_or_none()
    if not config:
        config = GlobalSettings()
        db.add(config)

    config.delivery_fee_hub_kobo = payload.delivery_fee_hub_kobo
    config.delivery_fee_home_kobo = payload.delivery_fee_home_kobo
    config.express_surcharge_kobo = payload.express_surcharge_kobo
    config.monthly_discount_kobo = payload.monthly_discount_kobo
    config.service_fee_percent = Decimal(str(payload.service_fee_percent))
    
    await db.commit()
    return {"status": "success"}