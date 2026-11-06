import asyncio
from sqlalchemy import update
from app.core.database import AsyncSessionLocal, engine
from app.models.product import Product

async def update_kg():
    async with AsyncSessionLocal() as db:
        # Update Rice
        await db.execute(
            update(Product)
            .where(Product.name == "Royal Stallion Rice")
            .values(local_unit_kg=2.5) # 1 Derica of Rice = 2.5kg
        )
        # Update Beans
        await db.execute(
            update(Product)
            .where(Product.name == "Local Honey Beans")
            .values(local_unit_kg=0.8) # 1 Paint Bucket of Beans = 0.8kg
        )
        await db.commit()
        print("✅ Product KG conversions updated!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(update_kg())