# Python Agent Platform - Project To-Do

## 0) Guardrails and Scope
- [ ] Define allowed actions list (file ops, app tasks, approved scripts only).
- [ ] Ban unrestricted remote shell by default.
- [ ] Write threat model (device takeover, token theft, replay, insider misuse).
- [ ] Define compliance/audit requirements.

## 1) Architecture and Repo Setup
- [ ] Create mono-repo structure:
  - `server/control_plane/` (Django)
  - `server/agent_api/` (FastAPI)
  - `agent/local_agent/` (Python)
  - `shared/schemas/` (Pydantic models)
- [ ] Add pre-commit, lint, format, type-check (`ruff`, `black`, `mypy`).
- [ ] Add CI pipeline for tests + lint + security checks.

## 2) Identity and Security Foundation
- [ ] Implement Django auth with MFA (TOTP/WebAuthn).
- [ ] Add RBAC roles: `owner`, `admin`, `operator`, `viewer`.
- [ ] Implement per-device identity and registration flow.
- [ ] Issue short-lived access tokens + refresh strategy.
- [ ] Add mTLS between agent and server.
- [ ] Add signed command envelopes and nonce/replay protection.

## 3) Control Plane (Django)
- [ ] Build models: `User`, `Organization`, `Device`, `Task`, `TaskRun`, `AuditLog`.
- [ ] Create admin dashboard for device inventory and task history.
- [ ] Build API endpoints for task creation, status, cancellation.
- [ ] Add policy engine for command allowlists.

## 4) Agent API and Job System (FastAPI + Celery)
- [ ] Implement secure ingestion endpoints for agents.
- [ ] Add command queueing and scheduling.
- [ ] Add retry policy, backoff, timeout, and dead-letter queue.
- [ ] Add WebSocket/SSE for live task updates.

## 5) Local Agent (Python)
- [ ] Build cross-platform agent core (Windows + Linux).
- [ ] Add secure bootstrap installer and device enrollment.
- [ ] Implement heartbeat, config pull, task pull/ack flow.
- [ ] Implement task runners with strict capability boundaries.
- [ ] Add local tamper-evident logs and safe self-update.

## 6) Task Automation Catalog
- [ ] Define task schema and versioning.
- [ ] Implement first safe tasks:
  - process control (allowlisted)
  - file copy/move in approved directories
  - run approved scripts with signed checksum
- [ ] Add idempotency keys and task dedupe.

## 7) Observability and Audit
- [ ] Centralized logs (server + agent correlation IDs).
- [ ] Metrics and alerts (offline agents, failed tasks, auth anomalies).
- [ ] Immutable audit trail for every command and execution result.

## 8) Deployment
- [ ] Dockerize Django/FastAPI/worker stack.
- [ ] Provision PostgreSQL + Redis.
- [ ] Set up TLS certificates and secret management.
- [ ] Create staging environment and rollout plan.

## 9) Testing and Hardening
- [ ] Unit tests for auth, policy, task lifecycle.
- [ ] Integration tests for end-to-end command execution.
- [ ] Security tests: replay, token theft simulation, privilege escalation.
- [ ] Load tests for 1k+ concurrent agents.

## 10) MVP Definition of Done
- [ ] Admin can securely register a device.
- [ ] Admin can issue allowlisted task to one device or group.
- [ ] Agent executes task and returns signed result.
- [ ] Full audit trail visible in dashboard.
- [ ] Revoke access immediately and device can no longer execute tasks.
