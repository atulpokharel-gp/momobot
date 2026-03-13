from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "dev"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_issuer: str = "agent-api"
    device_registration_token: str = "register-me"
    operator_api_token: str = "operator-me"
    command_signing_secret: str = "signing-secret-me"
    database_url: str = "sqlite:///./agent_api.db"
    command_lease_seconds: int = 120

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
