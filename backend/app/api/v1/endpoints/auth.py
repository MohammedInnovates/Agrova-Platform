from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import uuid

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import hash_password
from app.models.user import User
from app.schemas.auth import LoginInput, RegisterInput, TokenOutput, UserOutput
from app.services.auth_service import authenticate_user, register_user, clean_nigerian_phone

router = APIRouter()

class ForgotPasswordInput(BaseModel):
    phone: str

class ResetPasswordInput(BaseModel):
    phone: str
    new_password: str

class ProfileUpdateInput(BaseModel):
    full_name: str
    estate_id: uuid.UUID | None = None
    default_address_directions: str | None = None

@router.post("/register", response_model=TokenOutput, status_code=201)
async def register(payload: RegisterInput, db: AsyncSession = Depends(get_db)):
    return await register_user(db, payload)

@router.post("/token", response_model=TokenOutput)
async def login(payload: LoginInput, db: AsyncSession = Depends(get_db)):
    return await authenticate_user(db, payload)

@router.get("/me", response_model=UserOutput)
async def me(current_user: User = Depends(get_current_user)):
    return UserOutput(
        id=current_user.id, 
        phone=current_user.phone, 
        full_name=current_user.full_name, 
        role=current_user.role,
        estate_id=current_user.estate_id,
        default_address_directions=current_user.default_address_directions
    )

@router.put("/profile", response_model=UserOutput)
async def update_profile(payload: ProfileUpdateInput, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.full_name = payload.full_name
    
    if payload.estate_id is not None:
        current_user.estate_id = payload.estate_id
        
    current_user.default_address_directions = payload.default_address_directions
    
    await db.commit()
    await db.refresh(current_user)
    
    return UserOutput(
        id=current_user.id, 
        phone=current_user.phone, 
        full_name=current_user.full_name, 
        role=current_user.role,
        estate_id=current_user.estate_id,
        default_address_directions=current_user.default_address_directions
    )

@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordInput, db: AsyncSession = Depends(get_db)):
    clean_phone = clean_nigerian_phone(payload.phone)
    result = await db.execute(select(User).where(User.phone == clean_phone))
    user = result.scalar_one_or_none()
    if not user:
        return {"status": "success", "message": "If this phone exists, a reset link was sent."}
    return {"status": "success", "message": "Verification successful. You can now reset your password."}

@router.post("/reset-password")
async def reset_password(payload: ResetPasswordInput, db: AsyncSession = Depends(get_db)):
    clean_phone = clean_nigerian_phone(payload.phone)
    result = await db.execute(select(User).where(User.phone == clean_phone))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = hash_password(payload.new_password)
    await db.commit()
    return {"status": "success", "message": "Password updated successfully. You can now log in."}