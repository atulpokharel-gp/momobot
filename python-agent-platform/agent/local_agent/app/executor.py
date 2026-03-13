from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any

from shared.schemas.agent_protocol import TaskType

from .config import get_settings


class Executor:
    def __init__(self) -> None:
        self.settings = get_settings()

    def execute(self, task_type: TaskType, payload: dict[str, Any]) -> tuple[bool, str, str]:
        if task_type is TaskType.ECHO:
            return True, str(payload.get("message", "")), ""
        if task_type is TaskType.LIST_DIR:
            return self._list_dir(payload)
        if task_type is TaskType.RUN_SCRIPT:
            return self._run_script(payload)
        return False, "", f"Task type {task_type.value} is not supported"

    def _allowed_roots(self) -> list[Path]:
        return [
            Path(value.strip()).resolve()
            for value in self.settings.allowed_list_roots.split(",")
            if value.strip()
        ]

    def _list_dir(self, payload: dict[str, Any]) -> tuple[bool, str, str]:
        raw_path = payload.get("path")
        if not raw_path:
            return False, "", "payload.path is required"

        target = Path(str(raw_path)).resolve()
        if not any(root == target or root in target.parents for root in self._allowed_roots()):
            return False, "", "Requested path is outside allowed roots"

        if not target.exists() or not target.is_dir():
            return False, "", "Target path does not exist or is not a directory"

        entries = [p.name for p in target.iterdir()]
        return True, json.dumps(entries), ""

    def _run_script(self, payload: dict[str, Any]) -> tuple[bool, str, str]:
        script_id = payload.get("script_id")
        if not script_id:
            return False, "", "payload.script_id is required"

        scripts_file = self.settings.approved_scripts_file
        if not scripts_file.exists():
            return False, "", "approved_scripts.json is missing"

        scripts = json.loads(scripts_file.read_text()).get("scripts", {})
        spec = scripts.get(str(script_id))
        if spec is None:
            return False, "", f"script_id {script_id} is not approved"

        command = spec.get("command")
        if not isinstance(command, list) or not command:
            return False, "", "Approved script command is invalid"

        cwd = spec.get("cwd")
        timeout = int(spec.get("timeout_seconds", 60))

        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=timeout,
                check=False,
                cwd=cwd,
            )
        except Exception as exc:  # noqa: BLE001
            return False, "", str(exc)

        output = (result.stdout or "").strip()
        err = (result.stderr or "").strip()
        if result.returncode == 0:
            return True, output, err
        return False, output, f"exit_code={result.returncode}; {err}"
