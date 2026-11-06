import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models import User


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.phone == "+2348000000001")
        )
        user = result.scalar_one()
        print(f"USER_ID: {user.id}")
        print(f"PHONE:   {user.phone}")
        print(f"NAME:    {user.full_name}")
        print(f"ESTATE:  {user.estate_id}")


if __name__ == "__main__":
    asyncio.run(main())