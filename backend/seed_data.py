import asyncio
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select

from app.core.database import AsyncSessionLocal, engine
from app.models import (
    BatchWindow, Estate, Product, ProductPriceTier, Supplier, User,
    WalletAccount, Zone,
)


async def seed():
    async with AsyncSessionLocal() as db:
        print("🌱 Starting seed...\n")

        # ---------- 1. ZONES ----------
        zones = {}
        for name, code, desc in [
            ("North-West Cluster", "NW", "Gwarinpa, Jabi, Utako, Wuse"),
            ("South-East Cluster", "SE", "Lugbe, Apo, Gudu, Kubwa"),
        ]:
            existing = await db.execute(select(Zone).where(Zone.code == code))
            z = existing.scalar_one_or_none()
            if not z:
                z = Zone(name=name, code=code, description=desc)
                db.add(z)
                await db.flush()
                print(f"  ✅ Zone: {name} ({code})")
            zones[code] = z

        # ---------- 2. ESTATES ----------
        estates_data = [
            ("Gwarinpa Estate", "Gwarinpa", "NW", "Block 4, behind the gate mosque"),
            ("Jabi Lake Estate", "Jabi", "NW", "Off Ahmadu Bello Way"),
            ("Lugbe Phase 1", "Lugbe", "SE", "After NNPC junction, first gate on right"),
        ]
        estates = {}
        for name, area, zone_code, directions in estates_data:
            existing = await db.execute(select(Estate).where(Estate.name == name))
            e = existing.scalar_one_or_none()
            if not e:
                e = Estate(
                    zone_id=zones[zone_code].id,
                    name=name, area=area, direction_notes=directions,
                )
                db.add(e)
                await db.flush()
                print(f"  ✅ Estate: {name} (Zone {zone_code})")
            estates[name] = e

        # ---------- 3. TEST USER ----------
        existing = await db.execute(select(User).where(User.phone == "+2348000000001"))
        user = existing.scalar_one_or_none()
        if not user:
            user = User(
                phone="+2348000000001",
                full_name="Test Customer",
                role="customer",
                estate_id=estates["Gwarinpa Estate"].id,
            )
            db.add(user)
            await db.flush()
            print(f"  ✅ User: {user.full_name} ({user.phone})")
        else:
            print(f"  ℹ️  User already exists: {user.phone}")

        # Create wallet for the user
        existing = await db.execute(select(WalletAccount).where(WalletAccount.user_id == user.id))
        if not existing.scalar_one_or_none():
            db.add(WalletAccount(user_id=user.id, balance_kobo=0))
            print(f"  ✅ Wallet created for {user.full_name}")

        # ---------- 4. SUPPLIER ----------
        existing = await db.execute(select(Supplier).where(Supplier.name == "Nasarawa Rice Hub"))
        supplier = existing.scalar_one_or_none()
        if not supplier:
            supplier = Supplier(
                name="Nasarawa Rice Hub",
                state_region="Nasarawa",
                contact_phone="+2348100000001",
            )
            db.add(supplier)
            await db.flush()
            print(f"  ✅ Supplier: {supplier.name}")

        # ---------- 5. PRODUCTS ----------
        products_data = [
            {
                "name": "Royal Stallion Rice",
                "category": "Staples",
                "phase": 1,
                "bulk_unit": "50kg Bag",
                "bulk_unit_price_kobo": 5_700_000,  # ₦57,000
                "local_unit_name": "Derica",
                "local_unit_multiplier": Decimal("0.05"),
                "brand": "Royal Stallion",
                "producer": "Stallion Group",
                "grade": "Premium Parboiled",
            },
            {
                "name": "Kings Vegetable Oil",
                "category": "Oils",
                "phase": 1,
                "bulk_unit": "25L Keg",
                "bulk_unit_price_kobo": 4_500_000,  # ₦45,000
                "local_unit_name": None,
                "local_unit_multiplier": None,
                "brand": "Kings",
                "producer": "Grand Cereals",
                "grade": "Refined",
            },
            {
                "name": "Local Honey Beans",
                "category": "Staples",
                "phase": 1,
                "bulk_unit": "50kg Bag",
                "bulk_unit_price_kobo": 7_000_000,  # ₦70,000
                "local_unit_name": "Paint Bucket",
                "local_unit_multiplier": Decimal("0.075"),
                "brand": "Local",
                "producer": "Benue Farms",
                "grade": "Grade A",
            },
        ]
        products = {}
        for pdata in products_data:
            existing = await db.execute(select(Product).where(Product.name == pdata["name"]))
            p = existing.scalar_one_or_none()
            if not p:
                p = Product(**pdata)
                db.add(p)
                await db.flush()
                print(f"  ✅ Product: {p.name} ({p.bulk_unit})")
            products[pdata["name"]] = p

        # ---------- 6. PRICE TIERS ----------
        tiers = [
            ("Royal Stallion Rice", Decimal("5"), 5_500_000, "Bulk 5+ (₦55k/bag)"),
            ("Royal Stallion Rice", Decimal("10"), 5_200_000, "Wholesale 10+ (₦52k/bag)"),
            ("Local Honey Beans", Decimal("5"), 6_800_000, "Bulk 5+ (₦68k/bag)"),
        ]
        for prod_name, min_qty, unit_price, label in tiers:
            existing = await db.execute(
                select(ProductPriceTier).where(
                    ProductPriceTier.product_id == products[prod_name].id,
                    ProductPriceTier.min_quantity == min_qty,
                )
            )
            if not existing.scalar_one_or_none():
                db.add(ProductPriceTier(
                    product_id=products[prod_name].id,
                    min_quantity=min_qty,
                    unit_price_kobo=unit_price,
                    label=label,
                ))
                print(f"  ✅ Tier: {prod_name} — {label}")

        # ---------- 7. BATCH WINDOW (this week's delivery) ----------
        now = datetime.now(timezone.utc)
        # Next Saturday
        days_until_sat = (5 - now.weekday() + 7) % 7 or 7
        delivery_date = (now + timedelta(days=days_until_sat)).date()
        # Cutoff = Thursday 23:59 Lagos (22:59 UTC)
        days_until_thu = (3 - now.weekday() + 7) % 7 or 7
        cutoff_at = (now + timedelta(days=days_until_thu)).replace(
            hour=22, minute=59, second=0, microsecond=0
        )
        batch_code = f"W{delivery_date.strftime('%Y%V')}"

        existing = await db.execute(select(BatchWindow).where(BatchWindow.code == batch_code))
        batch = existing.scalar_one_or_none()
        if not batch:
            batch = BatchWindow(
                code=batch_code,
                cutoff_at=cutoff_at,
                delivery_date=delivery_date,
                status="SCHEDULED",
            )
            db.add(batch)
            print(f"  ✅ Batch: {batch_code} (Cutoff: {cutoff_at}, Delivery: {delivery_date})")
        else:
            print(f"  ℹ️  Batch already exists: {batch_code}")

        await db.commit()
        print("\n" + "=" * 50)
        print("🎉 SEED COMPLETE!")
        print("=" * 50)
        print(f"Test user phone: {user.phone}")
        print(f"Test user ID:    {user.id}")
        print(f"Active batch:    {batch_code}")
        print(f"Delivery date:   {delivery_date}")
        print("=" * 50 + "\n")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())