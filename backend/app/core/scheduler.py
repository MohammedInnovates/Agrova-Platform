import logging
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select, update
from app.core.database import AsyncSessionLocal
from app.models.batch_window import BatchWindow
from app.models.order import Order

logger = logging.getLogger("uvicorn")
scheduler = AsyncIOScheduler()

async def process_weekly_cutoff():
    """
    Runs every Thursday at 23:59.
    Locks the active batch and marks all PAID orders as PROCURED.
    """
    logger.info("⏰ CRON JOB TRIGGERED: Weekly Batch Cutoff")
    
    async with AsyncSessionLocal() as db:
        try:
            # 1. Find the active SCHEDULED batch
            result = await db.execute(
                select(BatchWindow).where(BatchWindow.status == "SCHEDULED")
            )
            batch = result.scalar_one_or_none()
            
            if not batch:
                logger.warning("⚠️ No active SCHEDULED batch found to lock.")
                return

            # 2. Lock the Batch
            batch.status = "LOCKED"
            batch.cutoff_processed_at = datetime.now(timezone.utc)
            batch.locked_at = datetime.now(timezone.utc)
            
            # 3. Auto-move all PAID orders to PROCURED (ready for farm manifest)
            await db.execute(
                update(Order)
                .where(Order.status == "PAID")
                .where(Order.batch_window_id == batch.id)
                .values(status="PROCURED")
            )
            
            await db.commit()
            logger.info(f"✅ Batch {batch.code} LOCKED. All paid orders marked as PROCURED.")
            
        except Exception as e:
            await db.rollback()
            logger.error(f"❌ Error during weekly cutoff: {str(e)}")

# Start the scheduler
def start_scheduler():
    # Cron trigger: Run every Thursday (day_of_week='thu') at 23:59
    scheduler.add_job(
        process_weekly_cutoff, 
        'cron', 
        day_of_week='thu', 
        hour=23, 
        minute=59,
        timezone='Africa/Lagos'
    )
    scheduler.start()
    logger.info("⏰ Weekly Batch Scheduler initialized (Runs Thursdays at 23:59 WAT).")