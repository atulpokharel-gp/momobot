from __future__ import annotations

from datetime import UTC, datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class CommandStatus(str, Enum):
    QUEUED = "queued"
    LEASED = "leased"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELED = "canceled"


class TaskType(str, Enum):
    ECHO = "echo"
    LIST_DIR = "list_dir"
    RUN_SCRIPT = "run_script"


class RegisterRequest(BaseModel):
    device_name: str = Field(min_length=2, max_length=128)
    fingerprint: str = Field(min_length=6, max_length=256)


class RegisterResponse(BaseModel):
    device_id: UUID
    access_token: str
    expires_at: datetime


class DeviceSummary(BaseModel):
    device_id: UUID
    device_name: str
    fingerprint: str
    status: str
    last_seen_at: datetime


class CommandIssueRequest(BaseModel):
    device_id: UUID
    task_type: TaskType
    payload: dict[str, Any] = Field(default_factory=dict)


class CommandResponse(BaseModel):
    command_id: UUID
    device_id: UUID
    task_type: TaskType
    payload: dict[str, Any]
    nonce: str
    signature: str
    status: CommandStatus
    created_at: datetime


class NextCommandResponse(BaseModel):
    command: CommandResponse | None


class CommandResultRequest(BaseModel):
    success: bool
    output: str = ""
    error: str = ""


class HealthResponse(BaseModel):
    status: str = "ok"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
