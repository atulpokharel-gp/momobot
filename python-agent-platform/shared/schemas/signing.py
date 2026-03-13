from __future__ import annotations

import hashlib
import hmac
import json
from typing import Any


def build_command_signature(
    *,
    command_id: str,
    device_id: str,
    task_type: str,
    payload: dict[str, Any],
    nonce: str,
    secret: str,
) -> str:
    payload_part = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    message = f"{command_id}|{device_id}|{task_type}|{payload_part}|{nonce}"
    return hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()

