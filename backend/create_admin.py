import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine
from app.core.security import hash_password
from app.models.user import User

async def create_admin():
    async with AsyncSessionLocal() as db:
        # Check if admin already exists
        result = await db.execute(select(User).where(User.phone == "+2348000000000"))
        existing = result.scalar_one_or_none()

        if existing:
            print("✅ Admin already exists!")
            print("Phone: 08000000000")
            print("Password: admin123")
            return

        # Create new admin
        admin = User(
            phone="+2348000000000",
            full_name="Super Admin",
            password_hash=hash_password("admin123"),
            role="admin"
        )
        db.add(admin)
        await db.commit()
        print("🎉 Admin user created successfully!")
        print("Phone: 08000000000")
        print("Password: admin123")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_admin())