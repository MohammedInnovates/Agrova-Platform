import httpx
from app.core.config import get_settings

settings = get_settings()

async def send_whatsapp_text(to_phone: str, message: str) -> dict:
    """Send a text message to a WhatsApp user via Meta Cloud API."""
    url = (
        f"https://graph.facebook.com/{settings.WHATSAPP_API_VERSION}/"
        f"{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    )

    payload = {
        "messaging_product": "whatsapp",
        "to": to_phone,
        "type": "text",
        "text": {"body": message, "preview_url": False},
    }

    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_TOKEN}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            data = response.json()

            if not response.is_success:
                print(f"⚠️  WhatsApp send failed: {data}")
                return {"success": False, "error": data}

            print(f"✅ WhatsApp sent to {to_phone}: {message[:50]}...")
            return {"success": True, "data": data}

    except Exception as e:
        print(f"❌ WhatsApp network error: {e}")
        return {"success": False, "error": str(e)}


async def send_whatsapp_buttons(
    to_phone: str, body_text: str, buttons: list[dict]
) -> dict:
    """Send an interactive message with up to 3 buttons."""
    url = (
        f"https://graph.facebook.com/{settings.WHATSAPP_API_VERSION}/"
        f"{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    )

    payload = {
        "messaging_product": "whatsapp",
        "to": to_phone,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {"text": body_text},
            "action": {
                "buttons": [
                    {"type": "reply", "reply": b} for b in buttons[:3]
                ]
            },
        },
    }

    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_TOKEN}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            data = response.json()
            if not response.is_success:
                print(f"⚠️  WhatsApp buttons failed: {data}")
                return {"success": False, "error": data}
            return {"success": True, "data": data}
    except Exception as e:
        print(f"❌ WhatsApp buttons error: {e}")
        return {"success": False, "error": str(e)}