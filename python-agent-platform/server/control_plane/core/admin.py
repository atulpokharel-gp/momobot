from __future__ import annotations

from django.contrib import admin

from .models import AuditLog, Device, Organization, Task, TaskRun


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ("device_name", "organization", "status", "last_seen_at")
    list_filter = ("status", "organization")
    search_fields = ("device_name", "fingerprint")


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("task_type", "device", "status", "created_at")
    list_filter = ("status", "task_type")


@admin.register(TaskRun)
class TaskRunAdmin(admin.ModelAdmin):
    list_display = ("task", "success", "created_at")
    list_filter = ("success",)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action", "actor", "target", "created_at")
    search_fields = ("action", "actor", "target")
