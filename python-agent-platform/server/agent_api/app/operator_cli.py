from __future__ import annotations

import argparse
import json

import requests

from .config import get_settings


class OperatorClient:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.base_url = "http://127.0.0.1:8000"

    def _headers(self) -> dict[str, str]:
        return {"X-Operator-Token": self.settings.operator_api_token}

    def list_devices(self) -> None:
        response = requests.get(f"{self.base_url}/v1/devices", headers=self._headers(), timeout=30)
        response.raise_for_status()
        print(json.dumps(response.json(), indent=2))

    def issue(self, device_id: str, task_type: str, payload: str) -> None:
        parsed_payload = json.loads(payload) if payload else {}
        response = requests.post(
            f"{self.base_url}/v1/commands",
            headers=self._headers(),
            json={"device_id": device_id, "task_type": task_type, "payload": parsed_payload},
            timeout=30,
        )
        response.raise_for_status()
        print(json.dumps(response.json(), indent=2))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Operator CLI")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("list-devices")

    issue = sub.add_parser("issue")
    issue.add_argument("--device-id", required=True)
    issue.add_argument("--task-type", required=True, choices=["echo", "list_dir", "run_script"])
    issue.add_argument("--payload", default="{}")

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    client = OperatorClient()
    client.base_url = args.base_url

    if args.command == "list-devices":
        client.list_devices()
        return

    client.issue(device_id=args.device_id, task_type=args.task_type, payload=args.payload)


if __name__ == "__main__":
    main()
