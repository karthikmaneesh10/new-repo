import os
from dotenv import load_dotenv

# Load variables from .env file (if present)
load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+psycopg2://postgres:root@localhost:5432/book%20rev"
)

# Render provides postgres:// or postgresql:// without the driver prefix
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+psycopg2://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

# Render passes PORT dynamically
APP_PORT = int(os.getenv("PORT", os.getenv("APP_PORT", "8000")))
APP_HOST = os.getenv("APP_HOST", "0.0.0.0")

cors_env = os.getenv("CORS_ORIGINS", "*")
if cors_env == "*":
    CORS_ORIGINS = ["*"]
else:
    CORS_ORIGINS = [origin.strip() for origin in cors_env.split(",")]
