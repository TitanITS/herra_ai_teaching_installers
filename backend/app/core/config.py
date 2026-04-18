from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Titan Platform API"
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = "sqlite:///./titan_dev.db"

    SECRET_KEY: str = "re_XFv8eCX6_Nnw3sZbby9UkiunePwKZwM6N"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://titannexustech.com",
        "https://www.titannexustech.com",
    ]

    DEMO_REQUEST_TO_EMAIL: str = "louis.yuhas@titanlogicsystems.com"
    DEMO_REQUEST_FROM_EMAIL: str = "noreply@titanlogicsystems.com"

    RESEND_API_KEY: str = ""

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True

    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_CUSTOMER_PORTAL_RETURN_URL: str = "http://localhost:5173/portal/billing"

    HERRA_BACKEND_BASE_URL: str = "http://127.0.0.1:8001"
    HERRA_FRONTEND_BASE_URL: str = "http://127.0.0.1:5174"
    HERRA_FRONTEND_DEFAULT_TAB: str = "ingest"
    HERRA_API_KEY: str = ""
    CONNECTOR_DOWNLOAD_BASE_URL: str = "http://127.0.0.1:8000/downloads/connectors"
    CONNECTOR_DEFAULT_BOOTSTRAP_EXPIRES_MINUTES: int = 60
    CONNECTOR_MAX_BOOTSTRAP_EXPIRES_MINUTES: int = 1440

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()