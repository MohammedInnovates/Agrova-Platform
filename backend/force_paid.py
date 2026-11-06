import asyncio
from sqlalchemy import update
from app.core.database import AsyncSessionLocal, engine
from app.models.order import Order

async def force_paid():
    async with AsyncSessionLocal() as db:
        # Update ALL orders to PAID
        await db.execute(
            update(Order).values(status="PAID")
        )
        await db.commit()
        print("✅ ALL ORDERS MARKED AS PAID SUCCESSFULLY!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(force_paid())