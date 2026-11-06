import asyncio
from sqlalchemy import delete, select
from app.core.database import AsyncSessionLocal, engine
from app.core.security import hash_password
from app.models.user import User
from app.services.auth_service import clean_nigerian_phone

async def reset_admin():
    async with AsyncSessionLocal() as db:
        admin_phone = clean_nigerian_phone("08000000000")
        admin_password = "Password123!"
        
        # 1. Delete any existing admin with this number to prevent conflicts
        await db.execute(delete(User).where(User.phone == admin_phone))
        
        # 2. Create a fresh admin
        admin = User(
            phone=admin_phone,
            full_name="Super Admin",
            password_hash=hash_password(admin_password),
            role="admin"
        )
        db.add(admin)
        await db.commit()
        
        print("✅ ======================================")
        print("✅ ADMIN ACCOUNT CREATED SUCCESSFULLY!")
        print("✅ ======================================")
        print(f"👉 Phone Number: 08000000000")
        print(f"👉 Password:     {admin_password}")
        print("✅ ======================================")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(reset_admin())