from functools import lru_cache
from urllib.parse import quote_plus
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    APP_NAME: str = "Agrova"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Database
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str = "127.0.0.1"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Paystack
    PAYSTACK_SECRET_KEY: str = "sk_test_placeholder"
    PAYSTACK_PUBLIC_KEY: str = "pk_test_placeholder"

    # OpenAI
    OPENAI_API_KEY: str = "sk-placeholder"

    # WhatsApp
    WHATSAPP_TOKEN: str = "placeholder"
    WHATSAPP_PHONE_NUMBER_ID: str = "placeholder"
    WHATSAPP_VERIFY_TOKEN: str = "agrover_webhook_verify_2026"
    WHATSAPP_API_VERSION: str = "v22.0"

    # JWT
    JWT_SECRET: str = "agrover-dev-secret-change-in-production-2026"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24

    @property
    def DATABASE_URL(self) -> str:
        safe_password = quote_plus(self.POSTGRES_PASSWORD)
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{safe_password}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


@lru_cache()
def get_settings() -> Settings:
    return Settings()