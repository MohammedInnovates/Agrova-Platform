from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings

settings = get_settings()

# pool_pre_ping tests connections before use, preventing "connection closed"
# errors after PostgreSQL restarts or idle timeouts. pool_size/max_overflow
# control concurrent connections.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# expire_on_commit=False keeps model attributes accessible after commit.
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields a database session and guarantees
    closure even if an exception is raised in the route handler.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()