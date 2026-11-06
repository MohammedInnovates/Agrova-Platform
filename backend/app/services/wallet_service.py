import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.wallet import WalletAccount

async def get_or_create_wallet(db: AsyncSession, user_id: uuid.UUID) -> WalletAccount:
    result = await db.execute(select(WalletAccount).where(WalletAccount.user_id == user_id))
    wallet = result.scalar_one_or_none()
    
    if not wallet:
        wallet = WalletAccount(user_id=user_id, balance_kobo=0)
        db.add(wallet)
        await db.commit()
        await db.refresh(wallet)
        
    return wallet