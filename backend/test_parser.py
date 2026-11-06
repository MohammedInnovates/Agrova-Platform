import asyncio
from app.core.database import AsyncSessionLocal
from app.services.ai_parser_service import parse_shopping_list


async def main():
    test_list = (
        "2 bags of Royal Stallion Rice\n"
        "5 dericas of beans\n"
        "1 keg of Kings oil\n"
        "3 tubers of yam"
    )

    async with AsyncSessionLocal() as db:
        result = await parse_shopping_list(db, test_list)

        print(f"\n{'=' * 60}")
        print(f"PARSED {len(result.items)} ITEMS")
        print(f"{'=' * 60}\n")

        for item in result.items:
            print(f"📝 Raw:        {item.raw_text}")
            print(f"   Matched:    {item.product_name} ({item.product_brand})")
            print(f"   Quantity:   {item.quantity} × {item.unit_kind}")
            print(f"   Unit price: ₦{item.unit_price_kobo / 100:,.0f}")
            print(f"   Line total: ₦{item.line_total_kobo / 100:,.0f}")
            print(f"   Confidence: {item.confidence}")
            if item.note:
                print(f"   Note:       {item.note}")
            print()

        if result.unmatched:
            print(f"⚠️  UNMATCHED ({len(result.unmatched)}):")
            for u in result.unmatched:
                print(f"   - {u}")
            print()

        print(f"{'=' * 60}")
        print(f"TOTAL ESTIMATE: ₦{result.total_kobo / 100:,.0f}")
        print(f"{'=' * 60}\n")


if __name__ == "__main__":
    asyncio.run(main())