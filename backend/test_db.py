import asyncio
from sqlalchemy import text
from app.core.database import engine

async def test_connection():
    print("Connecting to PostgreSQL...")
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            print(f"✅ DATABASE CONNECTED! Result: {result.scalar()}")
    except Exception as e:
        print(f"❌ CONNECTION FAILED: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_connection())