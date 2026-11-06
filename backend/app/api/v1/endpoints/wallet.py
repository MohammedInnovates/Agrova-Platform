import uuid
import traceback
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.wallet import WalletTransaction
from app.schemas.wallet import WalletTopUpInput, WalletResponse
from app.services.wallet_service import get_or_create_wallet
from app.services.payment_service import initialize_wallet_topup
from app.api.deps import require_admin
from app.models.user import User

router = APIRouter()

class AdminRefundInput(BaseModel):
    amount_kobo: int
    reason: str

@router.get("/{user_id}", response_model=WalletResponse, summary="Get user wallet balance")
async def get_wallet(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    wallet = await get_or_create_wallet(db, user_id)
    return WalletResponse(id=wallet.id, user_id=wallet.user_id, balance_kobo=wallet.balance_kobo, currency=wallet.currency)

@router.post("/topup", summary="Initialize Paystack wallet top-up")
async def topup_wallet(payload: WalletTopUpInput, db: AsyncSession = Depends(get_db)):
    return await initialize_wallet_topup(db, user_id=payload.user_id, amount_kobo=payload.amount_kobo, callback_url="http://localhost:3000/payment/callback")

@router.post("/admin/{user_id}/refund", summary="Admin: Credit a user's wallet (Refund)")
async def admin_refund_wallet(user_id: uuid.UUID, payload: AdminRefundInput, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    try:
        wallet = await get_or_create_wallet(db, user_id)
        
        # Ensure we are working with integers
        new_balance = int(wallet.balance_kobo) + int(payload.amount_kobo)
        wallet.balance_kobo = new_balance
        
        # Log the transaction
        tx = WalletTransaction(
            wallet_id=wallet.id,
            direction="CREDIT",
            amount_kobo=int(payload.amount_kobo),
            balance_after_kobo=new_balance,
            reason="REFUND",
            status="COMPLETED",
            narration=f"Admin Refund: {payload.reason}",
            reference=f"admin-refund-{uuid.uuid4().hex[:8]}"
        )
        db.add(tx)
        
        await db.commit()
        return {"status": "success", "message": f"Wallet credited with ₦{payload.amount_kobo / 100:,.0f}"}
        
    except Exception as e:
        await db.rollback()
        error_msg = str(e)
        print(f"REFUND ERROR: {error_msg}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Refund failed: {error_msg}")