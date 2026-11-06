import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.models.user import User
from app.services.whatsapp_service import send_whatsapp_text
from app.core.config import get_settings

settings = get_settings()

async def alert_admin(db: AsyncSession, template_key: str, message: str, related_entity: str, related_entity_id: uuid.UUID):
    """
    Sends a notification to the Admin's WhatsApp (and logs it in the DB).
    """
    # 1. Find the admin user (Assuming role='admin')
    result = await db.execute(select(User).where(User.role == "admin").limit(1))
    admin = result.scalar_one_or_none()
    
    if not admin:
        print("⚠️ No Admin user found to send alert to.")
        return

    # 2. Log the notification in the database
    idempotency_key = f"{template_key}:{related_entity_id}"
    
    # Check if we already sent this alert to avoid duplicates
    existing = await db.execute(select(Notification).where(Notification.idempotency_key == idempotency_key))
    if existing.scalar_one_or_none():
        return # Already alerted

    notification = Notification(
        user_id=admin.id,
        channel="whatsapp",
        template_key=template_key,
        payload={"message": message},
        related_entity=related_entity,
        related_entity_id=related_entity_id,
        idempotency_key=idempotency_key,
        status="QUEUED"
    )
    db.add(notification)
    await db.commit()

    # 3. Send the WhatsApp message (Fails gracefully if keys are placeholders)
    try:
        # In production, this will actually send the message to the Admin's phone
        await send_whatsapp_text(admin.phone, f"🚨 *AGROVA ADMIN ALERT*\n\n{message}")
        
        # Update status to SENT
        notification.status = "SENT"
        await db.commit()
    except Exception as e:
        notification.status = "FAILED"
        notification.error_message = str(e)
        await db.commit()