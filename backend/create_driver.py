import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine
from app.core.security import hash_password
from app.models.user import User

async def create_driver():
    async with AsyncSessionLocal() as db:
        # Check if driver already exists
        result = await db.execute(select(User).where(User.phone == "+2348000000002"))
        existing = result.scalar_one_or_none()

        if existing:
            existing.role = "driver"
            existing.password_hash = hash_password("driver123")
            print("✅ Existing user updated to DRIVER!")
        else:
            driver = User(
                phone="+2348000000002",
                full_name="Abuja Driver",
                password_hash=hash_password("driver123"),
                role="driver"
            )
            db.add(driver)
            print("🎉 New DRIVER account created!")
            
        await db.commit()
        print("Phone: 08000000002")
        print("Password: driver123")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_driver())