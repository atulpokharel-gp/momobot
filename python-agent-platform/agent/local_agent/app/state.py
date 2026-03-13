from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


@dataclass
class DeviceState:
    device_id: str
    access_token: str
    expires_at: str

    @classmethod
    def load(cls, path: Path) -> DeviceState | None:
        if not path.exists():
            return None
        payload = json.loads(path.read_text())
        return cls(**payload)

    def dump(self, path: Path) -> None:
        path.write_text(
            json.dumps(
                {
                    "device_id": self.device_id,
                    "access_token": self.access_token,
                    "expires_at": self.expires_at,
                },
                indent=2,
            )
        )

    def expired(self) -> bool:
        return datetime.fromisoformat(self.expires_at) <= datetime.now().astimezone()
