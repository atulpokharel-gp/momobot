from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    agent_api_base_url: str = "http://127.0.0.1:8000"
    device_registration_token: str = "register-me"
    command_signing_secret: str = "signing-secret-me"
    poll_interval_seconds: int = 5
    request_timeout_seconds: int = 30
    allowed_list_roots: str = "C:\\Users\\Public,C:\\Temp"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    @property
    def state_file(self) -> Path:
        return Path(__file__).parent / "device_state.json"

    @property
    def approved_scripts_file(self) -> Path:
        return Path(__file__).parent / "approved_scripts.json"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
