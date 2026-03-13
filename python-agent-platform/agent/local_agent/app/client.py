from __future__ import annotations

from typing import Any, cast

import requests
from requests import Response

from shared.schemas.agent_protocol import (
    CommandResultRequest,
    NextCommandResponse,
    RegisterRequest,
    RegisterResponse,
)

from .config import get_settings


class AgentApiClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _url(self, path: str) -> str:
        return f"{self.settings.agent_api_base_url.rstrip('/')}{path}"

    def enroll(self, device_name: str, fingerprint: str) -> RegisterResponse:
        payload = RegisterRequest(device_name=device_name, fingerprint=fingerprint)
        response = requests.post(
            self._url("/v1/devices/register"),
            json=payload.model_dump(),
            headers={"X-Registration-Token": self.settings.device_registration_token},
            timeout=self.settings.request_timeout_seconds,
        )
        data = self._json_or_raise(response)
        return RegisterResponse.model_validate(data)

    def fetch_next_command(self, device_id: str, access_token: str) -> NextCommandResponse:
        response = requests.get(
            self._url(f"/v1/devices/{device_id}/commands/next"),
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=self.settings.request_timeout_seconds,
        )
        data = self._json_or_raise(response)
        return NextCommandResponse.model_validate(data)

    def submit_result(
        self,
        command_id: str,
        access_token: str,
        success: bool,
        output: str,
        error: str,
    ) -> dict[str, Any]:
        payload = CommandResultRequest(success=success, output=output, error=error)
        response = requests.post(
            self._url(f"/v1/commands/{command_id}/result"),
            json=payload.model_dump(),
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=self.settings.request_timeout_seconds,
        )
        return self._json_or_raise(response)

    @staticmethod
    def _json_or_raise(response: Response) -> dict[str, Any]:
        response.raise_for_status()
        data = response.json()
        if not isinstance(data, dict):
            raise ValueError("Expected JSON object response")
        return cast(dict[str, Any], data)
