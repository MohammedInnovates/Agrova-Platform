import asyncio
import httpx


async def main():
    payload = {
        "object": "whatsapp_business_account",
        "entry": [
            {
                "id": "123456",
                "changes": [
                    {
                        "value": {
                            "messaging_product": "whatsapp",
                            "messages": [
                                {
                                    "from": "2348000000001",
                                    "id": "wamid.test123",
                                    "timestamp": "1234567890",
                                    "type": "text",
                                    "text": {
                                        "body": "2 bags of rice and 5 dericas of beans"
                                    },
                                }
                            ],
                        },
                        "field": "messages",
                    }
                ],
            }
        ],
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            "http://localhost:8000/api/v1/whatsapp/webhook",
            json=payload,
        )
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")


if __name__ == "__main__":
    asyncio.run(main())