import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine
from app.models.zone import Zone
from app.models.estate import Estate

async def seed():
    async with AsyncSessionLocal() as db:
        print("🌱 Seeding Abuja Estates...")

        # 1. Create a default Zone (Required for estates)
        result = await db.execute(select(Zone).where(Zone.code == "ABJ"))
        zone = result.scalar_one_or_none()
        
        if not zone:
            zone = Zone(name="Abuja Central", code="ABJ", description="Main Abuja Area")
            db.add(zone)
            await db.flush()
            print("✅ Created Zone: Abuja Central")

        # 2. List of popular Abuja estates/areas
        estates_data = [
            "Gwarinpa Estate",
            "Jabi Lake Area",
            "Wuse 2",
            "Maitama",
            "Lugbe Phase 1",
            "Apo Legislative Quarters",
            "Kubwa",
            "Garki",
            "Asokoro",
            "Mabushi",
        ]

        # 3. Insert them into the database
        for name in estates_data:
            existing = await db.execute(select(Estate).where(Estate.name == name))
            if not existing.scalar_one_or_none():
                estate = Estate(
                    name=name,
                    area=name.split(" ")[0],
                    zone_id=zone.id,
                )
                db.add(estate)
                print(f"✅ Added Estate: {name}")

        await db.commit()
        print("🎉 ESTATES SEEDED SUCCESSFULLY!")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())