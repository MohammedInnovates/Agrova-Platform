from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.models.wallet import WalletAccount
from app.schemas.auth import LoginInput, RegisterInput, TokenOutput, UserOutput


def clean_nigerian_phone(phone: str) -> str:
    """Converts 080... to +23480..., and cleans +234..."""
    phone = phone.strip().replace(" ", "")
    if phone.startswith("+"):
        phone = phone[1:]
    if phone.startswith("234"):
        return "+" + phone
    if phone.startswith("0"):
        return "+234" + phone[1:]
    return "+" + phone


async def register_user(db: AsyncSession, payload: RegisterInput) -> TokenOutput:
    clean_phone = clean_nigerian_phone(payload.phone)

    existing = await db.execute(select(User).where(User.phone == clean_phone))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400, detail="Phone number already registered"
        )

    user = User(
        phone=clean_phone,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        role="customer",
    )
    db.add(user)
    await db.flush()

    # Auto-create wallet
    db.add(WalletAccount(user_id=user.id, balance_kobo=0))

    await db.commit()
    await db.refresh(user)

    token = create_access_token(str(user.id), user.role)

    return TokenOutput(
        access_token=token,
        user=UserOutput(
            id=user.id,
            phone=user.phone,
            full_name=user.full_name,
            role=user.role,
        ),
    )


async def authenticate_user(db: AsyncSession, payload: LoginInput) -> TokenOutput:
    clean_phone = clean_nigerian_phone(payload.phone)

    result = await db.execute(select(User).where(User.phone == clean_phone))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid phone or password")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid phone or password")

    token = create_access_token(str(user.id), user.role)

    return TokenOutput(
        access_token=token,
        user=UserOutput(
            id=user.id,
            phone=user.phone,
            full_name=user.full_name,
            role=user.role,
        ),
    )