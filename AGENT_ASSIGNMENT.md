# Multi-Agent Assignment Plan (Codex + Claude Style)

## Team Roles
1. `Agent-A (Codex) - Platform Lead`
- Owns architecture decisions, repo standards, and integration quality.
- Final approver for API contracts and merge readiness.

2. `Agent-B (Claude) - Security and Auth Lead`
- Owns MFA, mTLS, token lifecycle, RBAC, and threat mitigations.
- Reviews every endpoint for least-privilege and abuse resistance.

3. `Agent-C - Backend Execution Lead`
- Implements Django models, FastAPI endpoints, Celery workers.
- Owns data migration quality and performance.

4. `Agent-D - Local Agent Lead`
- Builds Python local agent, enrollment, heartbeat, task runner.
- Owns Windows/Linux reliability and safe updater.

5. `Agent-E - QA/Verification Lead`
- Owns test plans, integration tests, regression checks, load tests.
- Gates release with pass/fail criteria.

## Workstream Assignment
1. Security Foundation
- Primary: `Agent-B`
- Support: `Agent-A`
- Deliverables: auth design doc, RBAC matrix, mTLS flow, signed-command spec.

2. Control Plane + APIs
- Primary: `Agent-C`
- Support: `Agent-A`
- Deliverables: Django/FastAPI services, DB schema, task endpoints.

3. Local Agent
- Primary: `Agent-D`
- Support: `Agent-B`
- Deliverables: installer, enrollment, execution sandbox, reporting pipeline.

4. QA + Release
- Primary: `Agent-E`
- Support: `Agent-A`
- Deliverables: automated test suite, release checklist, incident rollback runbook.

## Collaboration Protocol
1. Branching
- `main` (stable), `develop` (integration), `feature/<area>-<ticket>`.

2. Contract-First Development
- API/spec PR merged first.
- Implementation PRs must match the approved contract.

3. Review Rules
- Every PR needs 2 approvals.
- Security-sensitive PRs require `Agent-B` approval.
- Local-agent execution changes require `Agent-D` + `Agent-B` approval.

4. Daily Cadence
- 15-minute standup with blockers and risk flags.
- End-of-day integration check on `develop`.

5. Definition of Ready
- Ticket has acceptance criteria, test plan, and security notes.

6. Definition of Done
- Code + tests + docs + audit logging verified.
- No high/critical vulnerabilities open.

## Suggested Sprint-1 Split (10 Working Days)
1. Days 1-2
- `Agent-A/B`: architecture + security specs.
- `Agent-C`: repo scaffolding + base services.
- `Agent-D`: agent skeleton + heartbeat stub.
- `Agent-E`: test harness setup.

2. Days 3-6
- `Agent-C`: task APIs + queueing.
- `Agent-D`: enrollment + command executor.
- `Agent-B`: MFA, token policy, mTLS integration.
- `Agent-E`: integration tests for happy path.

3. Days 7-10
- End-to-end hardening, audit logs, failure recovery.
- Load test and release candidate.

## Command Ownership Matrix
- Device enrollment: `Agent-D` (impl), `Agent-B` (security review)
- Task creation API: `Agent-C`
- Task policy enforcement: `Agent-B`
- Task execution engine: `Agent-D`
- Dashboard visibility: `Agent-C`
- End-to-end verification: `Agent-E`
