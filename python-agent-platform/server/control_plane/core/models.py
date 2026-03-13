from __future__ import annotations

import uuid

from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Organization(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=128, unique=True)

    def __str__(self) -> str:
        return self.name


class Device(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="devices")
    device_name = models.CharField(max_length=128)
    fingerprint = models.CharField(max_length=256, unique=True)
    status = models.CharField(max_length=32, default="online")
    last_seen_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.device_name} ({self.organization.name})"


class Task(TimeStampedModel):
    class TaskStatus(models.TextChoices):
        QUEUED = "queued", "Queued"
        RUNNING = "running", "Running"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="tasks")
    task_type = models.CharField(max_length=64)
    payload = models.JSONField(default=dict)
    status = models.CharField(max_length=32, choices=TaskStatus.choices, default=TaskStatus.QUEUED)
    issued_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.task_type} -> {self.device.device_name}"


class TaskRun(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="runs")
    success = models.BooleanField(default=False)
    output = models.TextField(blank=True, default="")
    error = models.TextField(blank=True, default="")

    def __str__(self) -> str:
        return f"Run {self.id} ({'ok' if self.success else 'fail'})"


class AuditLog(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.CharField(max_length=128)
    action = models.CharField(max_length=128)
    target = models.CharField(max_length=128)
    details = models.TextField(blank=True, default="")

    def __str__(self) -> str:
        return f"{self.action} by {self.actor}"
