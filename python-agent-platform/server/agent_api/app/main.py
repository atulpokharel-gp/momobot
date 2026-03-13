from __future__ import annotations

import json
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from shared.schemas.agent_protocol import (
    CommandIssueRequest,
    CommandResponse,
    CommandResultRequest,
    CommandStatus,
    DeviceSummary,
    HealthResponse,
    NextCommandResponse,
    RegisterRequest,
    RegisterResponse,
    TaskType,
)
from shared.schemas.signing import build_command_signature

from .auth import create_device_token, decode_device_token
from .config import get_settings
from .db import Base, engine, get_db
from .models import AuditLog, Command, Device

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Agent API", version="0.1.0", lifespan=lifespan)


def _require_operator(x_operator_token: str | None = Header(default=None)) -> None:
    if x_operator_token != settings.operator_api_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Operator token invalid",
        )


def _require_registration(x_registration_token: str | None = Header(default=None)) -> None:
    if x_registration_token != settings.device_registration_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Registration token invalid",
        )


def _require_device_id(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.split(" ", maxsplit=1)[1]
    return decode_device_token(token)


def _audit(db: Session, actor: str, action: str, target: str, details: str = "") -> None:
    db.add(AuditLog(actor=actor, action=action, target=target, details=details))


def _command_to_response(command: Command) -> CommandResponse:
    payload = json.loads(command.payload)
    return CommandResponse(
        command_id=UUID(command.id),
        device_id=UUID(command.device_id),
        task_type=TaskType(command.task_type),
        payload=payload,
        nonce=command.nonce,
        signature=command.signature,
        status=CommandStatus(command.status),
        created_at=command.created_at,
    )


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse()


@app.post("/v1/devices/register", response_model=RegisterResponse)
def register_device(
    body: RegisterRequest,
    _: None = Depends(_require_registration),
    db: Session = Depends(get_db),
) -> RegisterResponse:
    device = db.scalar(select(Device).where(Device.fingerprint == body.fingerprint))
    if device is None:
        device = Device(device_name=body.device_name, fingerprint=body.fingerprint)
        db.add(device)
        db.flush()
    else:
        device.device_name = body.device_name
        device.status = "online"
        device.last_seen_at = datetime.now(UTC)

    token, exp = create_device_token(device.id)
    _audit(db, actor="device", action="register", target=device.id, details=device.device_name)
    db.commit()

    return RegisterResponse(device_id=UUID(device.id), access_token=token, expires_at=exp)


@app.get(
    "/v1/devices",
    response_model=list[DeviceSummary],
    dependencies=[Depends(_require_operator)],
)
def list_devices(db: Session = Depends(get_db)) -> list[DeviceSummary]:
    records = db.scalars(select(Device).order_by(Device.created_at.desc())).all()
    return [
        DeviceSummary(
            device_id=UUID(d.id),
            device_name=d.device_name,
            fingerprint=d.fingerprint,
            status=d.status,
            last_seen_at=d.last_seen_at,
        )
        for d in records
    ]


@app.post("/v1/commands", response_model=CommandResponse, dependencies=[Depends(_require_operator)])
def issue_command(body: CommandIssueRequest, db: Session = Depends(get_db)) -> CommandResponse:
    device = db.get(Device, str(body.device_id))
    if device is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    command = Command(
        device_id=str(body.device_id),
        task_type=body.task_type.value,
        payload=json.dumps(body.payload),
        nonce=str(uuid4()),
        signature="",
        status=CommandStatus.QUEUED.value,
    )
    db.add(command)
    db.flush()
    command.signature = build_command_signature(
        command_id=command.id,
        device_id=command.device_id,
        task_type=command.task_type,
        payload=body.payload,
        nonce=command.nonce,
        secret=settings.command_signing_secret,
    )
    _audit(
        db,
        actor="operator",
        action="command.issue",
        target=command.id,
        details=command.task_type,
    )
    db.commit()
    db.refresh(command)
    return _command_to_response(command)


@app.get("/v1/devices/{device_id}/commands/next", response_model=NextCommandResponse)
def next_command(
    device_id: UUID,
    current_device_id: str = Depends(_require_device_id),
    db: Session = Depends(get_db),
) -> NextCommandResponse:
    if current_device_id != str(device_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Device id mismatch")

    device = db.get(Device, str(device_id))
    if device is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    device.last_seen_at = datetime.now(UTC)
    command = db.scalar(
        select(Command)
        .where(Command.device_id == str(device_id), Command.status == CommandStatus.QUEUED.value)
        .order_by(Command.created_at.asc())
        .limit(1)
    )
    if command is None:
        db.commit()
        return NextCommandResponse(command=None)

    command.status = CommandStatus.LEASED.value
    command.lease_expires_at = datetime.now(UTC) + timedelta(
        seconds=settings.command_lease_seconds
    )
    _audit(db, actor=device.id, action="command.lease", target=command.id)
    db.commit()
    db.refresh(command)
    return NextCommandResponse(command=_command_to_response(command))


@app.post("/v1/commands/{command_id}/result", response_model=CommandResponse)
def submit_result(
    command_id: UUID,
    body: CommandResultRequest,
    current_device_id: str = Depends(_require_device_id),
    db: Session = Depends(get_db),
) -> CommandResponse:
    command = db.get(Command, str(command_id))
    if command is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Command not found")
    if command.device_id != current_device_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Command-device mismatch")

    command.status = CommandStatus.COMPLETED.value if body.success else CommandStatus.FAILED.value
    command.result_output = body.output
    command.result_error = body.error
    _audit(
        db,
        actor=current_device_id,
        action="command.result",
        target=command.id,
        details=command.status,
    )
    db.commit()
    db.refresh(command)
    return _command_to_response(command)
