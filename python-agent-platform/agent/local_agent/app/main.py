from __future__ import annotations

import argparse
import logging
import time

from shared.schemas.agent_protocol import TaskType
from shared.schemas.signing import build_command_signature

from .client import AgentApiClient
from .config import get_settings
from .executor import Executor
from .state import DeviceState

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("local-agent")


def cmd_enroll(device_name: str, fingerprint: str) -> None:
    settings = get_settings()
    client = AgentApiClient()

    registration = client.enroll(device_name=device_name, fingerprint=fingerprint)
    state = DeviceState(
        device_id=str(registration.device_id),
        access_token=registration.access_token,
        expires_at=registration.expires_at.isoformat(),
    )
    state.dump(settings.state_file)
    logger.info("enrolled device_id=%s", state.device_id)


def run_loop(single_run: bool = False) -> None:
    settings = get_settings()
    client = AgentApiClient()
    executor = Executor()

    state = DeviceState.load(settings.state_file)
    if state is None:
        raise RuntimeError("Agent is not enrolled. Run enroll command first.")

    while True:
        try:
            next_command = client.fetch_next_command(state.device_id, state.access_token).command
            if next_command is None:
                if single_run:
                    return
                time.sleep(settings.poll_interval_seconds)
                continue

            expected_signature = build_command_signature(
                command_id=str(next_command.command_id),
                device_id=str(next_command.device_id),
                task_type=next_command.task_type.value,
                payload=next_command.payload,
                nonce=next_command.nonce,
                secret=settings.command_signing_secret,
            )
            if expected_signature != next_command.signature:
                client.submit_result(
                    command_id=str(next_command.command_id),
                    access_token=state.access_token,
                    success=False,
                    output="",
                    error="command signature verification failed",
                )
                logger.error("command signature invalid command_id=%s", next_command.command_id)
                if single_run:
                    return
                continue

            task_type = TaskType(next_command.task_type)
            success, output, error = executor.execute(task_type, next_command.payload)
            client.submit_result(
                command_id=str(next_command.command_id),
                access_token=state.access_token,
                success=success,
                output=output,
                error=error,
            )
            logger.info(
                "command processed command_id=%s task=%s success=%s",
                next_command.command_id,
                task_type.value,
                success,
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("agent loop error: %s", exc)
            if single_run:
                raise
            time.sleep(settings.poll_interval_seconds)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Local Agent")
    sub = parser.add_subparsers(dest="command", required=True)

    enroll_cmd = sub.add_parser("enroll", help="Enroll this local device")
    enroll_cmd.add_argument("--device-name", required=True)
    enroll_cmd.add_argument("--fingerprint", required=True)

    sub.add_parser("run", help="Run agent loop")
    sub.add_parser("once", help="Run one polling cycle")
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "enroll":
        cmd_enroll(device_name=args.device_name, fingerprint=args.fingerprint)
        return
    if args.command == "once":
        run_loop(single_run=True)
        return
    run_loop(single_run=False)


if __name__ == "__main__":
    main()
