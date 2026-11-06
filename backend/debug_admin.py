import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine
from app.core.security import hash_password, verify_password
from app.models.user import User

async def debug():
    async with AsyncSessionLocal() as db:
        # Get ALL users
        result = await db.execute(select(User))
        users = result.scalars().all()
        
        print(f"\n=== ALL USERS IN DATABASE ({len(users)}) ===\n")
        for u in users:
            print(f"Phone:      {u.phone!r}")  # repr shows exact characters
            print(f"Name:       {u.full_name}")
            print(f"Role:       {u.role}")
            print(f"Has hash:   {u.password_hash is not None}")
            if u.password_hash:
                print(f"Hash len:   {len(u.password_hash)}")
                # Test if 'admin123' verifies against this hash
                test = verify_password("admin123", u.password_hash)
                print(f"Verifies?   {test}")
            print("-" * 50)
        
        # Also test the exact auth flow
        print("\n=== TESTING AUTH FLOW ===\n")
        clean_phone = "+" + "08000000000".lstrip("+")
        print(f"Login tries to find phone: {clean_phone!r}")
        
        r2 = await db.execute(select(User).where(User.phone == clean_phone))
        found = r2.scalar_one_or_none()
        print(f"Found: {found is not None}")
        if found:
            print(f"Password 'admin123' verifies: {verify_password('admin123', found.password_hash)}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(debug())
    