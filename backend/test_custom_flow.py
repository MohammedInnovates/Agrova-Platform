import asyncio
import httpx


BASE = "http://localhost:8000/api/v1"
LIST_ID = "6af7b914-5b4d-4af6-8d49-5e921c1b76f4"


async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:

        # --- STEP 1: Admin quotes the list ---
        print("=" * 60)
        print("📝 STEP 1: Admin quoting the list")
        print("=" * 60)
        quote_payload = {
            "quoted_items": [
                {"name": "Royal Stallion Rice", "qty": 2, "unit": "bag", "price_kobo": 5700000},
                {"name": "Local Honey Beans", "qty": 5, "unit": "derica", "price_kobo": 525000},
                {"name": "Kings Vegetable Oil", "qty": 1, "unit": "keg", "price_kobo": 4500000},
            ],
            "quoted_total_kobo": 18525000,
            "admin_notes": "Confirmed available. Delivery this Saturday.",
        }
        r = await client.post(
            f"{BASE}/custom-lists/{LIST_ID}/quote", json=quote_payload
        )
        print(f"Status code: {r.status_code}")
        if r.status_code == 200:
            print(f"✅ List status now: {r.json().get('status')}")
            print(f"   Quoted at: {r.json().get('quoted_at')}")
        else:
            print(f"❌ Error: {r.text}")
            return

        # --- STEP 2: User accepts the quote ---
        print()
        print("=" * 60)
        print("💳 STEP 2: User accepting the quote")
        print("=" * 60)
        r = await client.post(f"{BASE}/custom-lists/{LIST_ID}/accept")
        print(f"Status code: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print(f"✅ Order created!")
            print(f"   Order ID: {data.get('order_id')}")
            print(f"   Total: ₦{data.get('total_kobo', 0) / 100:,.0f}")
            print(f"   Auth URL: {data.get('authorization_url')}")
            print(f"   Message: {data.get('message')}")
        else:
            print(f"❌ Error: {r.text}")
            return

        print()
        print("=" * 60)
        print("🎉 FULL WORKFLOW COMPLETE!")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())