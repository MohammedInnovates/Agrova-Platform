import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine
from app.core.security import hash_password
from app.models.user import User

async def create_user():
    async with AsyncSessionLocal() as db:
        # Clean out old test users
        existing = await db.execute(select(User).where(User.phone == "+2348000000000"))
        user = existing.scalar_one_or_none()
        if user:
            user.password_hash = hash_password("password123")
        else:
            user = User(phone="+2348000000000", full_name="Test User", password_hash=hash_password("password123"), role="customer")
            db.add(user)
        await db.commit()
        print("✅ Test Account Created!")
        print("Phone: 08000000000")
        print("Password: password123")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_user())