# Security Baseline

## Authentication
- Operator endpoints require `X-Operator-Token`.
- Device enrollment requires `X-Registration-Token`.
- Device operational calls require JWT bearer device tokens.

## Authorization
- Devices can only fetch commands for their own `device_id`.
- Devices can only submit results for commands assigned to that device.

## Command Guardrails
- Task execution is allowlisted (`echo`, `list_dir`, `run_script`).
- `run_script` executes only ids present in `approved_scripts.json`.
- `list_dir` is restricted to configured roots.
- Commands are signed by server (`HMAC-SHA256`) with nonce and verified by agent before execution.

## Auditability
- API writes audit events for register, issue, lease, and result actions.

## Gaps to Close Next
- Replace shared operator token with OIDC + MFA.
- Add mTLS for agent/server transport identity.
- Add strict replay-window controls and nonce expiration policy.
- Centralize immutable audit storage.
