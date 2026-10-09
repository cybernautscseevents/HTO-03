import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "KaamConnect API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "postgresql+psycopg2://postgres:nexus2026@localhost:5432/kaamconnect"
    DATABASE_URL_TEST: str = "postgresql+psycopg2://postgres:nexus2026@localhost:5432/kaamconnect_test"
    
    # Security
    JWT_SECRET: str = "kaamconnect-secure-production-jwt-secret-key-32charsmin"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Environment
    APP_ENV: str = "development"  # development, testing, production
    
    # Telecom / Voice Provider
    VOICE_PROVIDER_API_KEY: str = "mock-voice-provider-key-12345"
    
    # Storage
    STORAGE_BUCKET: str = "kaamconnect-evidence-vault"
    STORAGE_ENDPOINT: str = "https://storage.googleapis.com"
    
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
