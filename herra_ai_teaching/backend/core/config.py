import os

ENVIRONMENT = os.getenv("HERRA_ENV", "development")

API_KEYS = {
    "user-key": "user",
    "admin-key": "admin",
    "system-key": "system",
}

ALLOWED_ORIGINS = ["*"]
ENABLE_DOCS = True
