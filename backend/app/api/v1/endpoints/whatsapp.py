from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.services.whatsapp_handler import handle_incoming_message

settings = get_settings()
router = APIRouter()


@router.get(
    "/webhook",
    summary="Meta webhook verification (called by Meta once)",
    include_in_schema=False,
)
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_token == settings.WHATSAPP_VERIFY_TOKEN:
        print("✅ WhatsApp webhook verified by Meta")
        return PlainTextResponse(content=hub_challenge or "")
    print("❌ WhatsApp webhook verification failed")
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post(
    "/webhook",
    summary="Receive incoming WhatsApp messages (called by Meta)",
    include_in_schema=False,
)
async def receive_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    payload = await request.json()

    try:
        entries = payload.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                messages = value.get("messages", [])

                for msg in messages:
                    from_phone = msg.get("from")
                    if not from_phone:
                        continue
                    print(f"📱 WhatsApp from {from_phone}: {msg.get('type')}")
                    await handle_incoming_message(db, from_phone, msg)

    except Exception as e:
        print(f"⚠️  WhatsApp webhook error: {e}")

    return {"status": "ok"}