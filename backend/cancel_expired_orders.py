import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import AsyncSessionLocal, engine
from app.models.order import Order
from app.models.product import Product

async def cancel_expired():
    print("🔍 Checking for expired unpaid orders...")
    async with AsyncSessionLocal() as db:
        # Find orders pending for more than 24 hours
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
        
        result = await db.execute(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.status == "PENDING_PAYMENT")
            .where(Order.created_at < cutoff_time)
        )
        expired_orders = result.scalars().all()
        
        if not expired_orders:
            print("✅ No expired orders found. Everything is clean.")
            return

        for order in expired_orders:
            print(f"⚠️ Cancelling expired order #{order.id[:8]}")
            # Restore Stock
            for item in order.items:
                prod_result = await db.execute(select(Product).where(Product.id == item.product_id))
                product = prod_result.scalar_one_or_none()
                if product:
                    product.stock_quantity += int(item.quantity)
                    print(f"   Returned {item.quantity} units of {product.name} to stock.")
            
            order.status = "CANCELLED"
            
        await db.commit()
        print(f"🎉 Successfully cancelled {len(expired_orders)} expired orders.")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(cancel_expired())