"""Application configuration, loaded from environment variables / .env file.

Centralizing configuration here means every tunable value used in the
authentication decision (thresholds, minimum sample counts, JWT settings)
is declared in one place instead of being hardcoded next to the logic
that uses it.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=[".env", "../.env"],
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    DATABASE_URL: str = "sqlite:///./keystroke_auth.db"

    # Auth / JWT
    JWT_SECRET_KEY: str = "insecure-dev-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Keystroke enrollment
    AUTH_PHRASE: str = "My secure typing pattern is unique."
    MIN_ENROLLMENT_SAMPLES: int = 8
    MIN_OTHER_USERS_FOR_ML: int = 1
    MIN_IMPOSTOR_SAMPLES_PER_USER: int = 5

    # Authentication decision thresholds
    VERIFICATION_MATCH_THRESHOLD: float = 0.60
    VERIFICATION_SUSPICIOUS_THRESHOLD: float = 0.40
    AUTH_ENFORCEMENT_MODE: str = "strict"  # "strict" | "advisory"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    ENVIRONMENT: str = "development"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
