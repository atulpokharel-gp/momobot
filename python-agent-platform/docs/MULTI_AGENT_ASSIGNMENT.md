# Multi-Agent Assignment (Codex + Claude Style)

## Roles
1. Agent-A (Codex): Platform integration, contract ownership, merge gate.
2. Agent-B (Claude): Security/auth ownership (MFA, mTLS, signing, RBAC).
3. Agent-C: Backend APIs and queue orchestration.
4. Agent-D: Local agent runtime and execution safety.
5. Agent-E: QA, performance, and release verification.

## Workflow
1. Contract-first: API/schema PR before implementation PR.
2. Every PR needs 2 approvals.
3. Security-sensitive PR needs Agent-B approval.
4. Local execution changes need Agent-D + Agent-B approval.
5. Daily integration to `develop`; release from stabilized `main`.

## Ownership Matrix
1. Enrollment flow: Agent-D (impl), Agent-B (security review)
2. Command issue API: Agent-C
3. Command signing/policy: Agent-B
4. Agent execution + result path: Agent-D
5. Dashboard/admin and reporting: Agent-C
6. End-to-end regression and load checks: Agent-E
