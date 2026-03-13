# Project To-Do Status

## Completed in this MVP
- [x] Python mono-repo scaffold (`server`, `agent`, `shared`)
- [x] FastAPI agent API (register, issue command, poll next, submit result)
- [x] JWT-based device auth
- [x] Operator token gate on command/admin endpoints
- [x] Command queue persistence with SQLAlchemy (SQLite default)
- [x] Audit log writes for key actions
- [x] Local Python agent (enroll + polling loop + executor)
- [x] Allowlisted task execution (`echo`, `list_dir`, `run_script`)
- [x] Approved script catalog (`approved_scripts.json`)
- [x] Signed command envelopes (HMAC + nonce) + agent verification
- [x] Django control-plane models + admin registration
- [x] Django initial migration generated (`core/0001_initial.py`)
- [x] CI workflow + lint/type/test toolchain
- [x] Automated tests for API flow, executor, and signing utility

## Remaining for Production-Grade Completion
- [ ] OIDC login + MFA
- [ ] RBAC policy engine enforced at API level
- [ ] mTLS agent/server identity
- [ ] Replay-window expiration policy and nonce store
- [ ] Celery/Redis job queue and retry/dead-letter flow
- [ ] WebSocket/SSE live task updates
- [ ] Postgres default production deployment
- [ ] Immutable external audit sink
- [ ] Agent secure self-update channel
- [ ] Load/perf and adversarial security testing
