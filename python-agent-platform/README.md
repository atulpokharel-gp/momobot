# Python Agent Platform (MVP)

This repository contains a Python-first baseline for a consent-based remote task automation platform:

- `server/agent_api`: FastAPI service for device enrollment, command dispatch, and result intake.
- `server/control_plane`: Django admin-backed control-plane data model.
- `agent/local_agent`: Local agent that enrolls, polls, executes allowlisted tasks, and reports results.
- `shared/schemas`: Shared Pydantic protocol models.

## Quick Start

1. Copy `.env.example` to `.env` and set secrets.
2. Install dependencies: `pip install -r requirements.txt`
3. Run API: `uvicorn server.agent_api.app.main:app --reload --port 8000`
4. Run Django migrations:
   - `python server/control_plane/manage.py migrate`
   - `python server/control_plane/manage.py createsuperuser`
5. Run agent:
   - `python -m agent.local_agent.app.main enroll --device-name <name> --fingerprint <fp>`
   - `python -m agent.local_agent.app.main run`

## Task Types (Allowlisted)

- `echo`: Return a message.
- `list_dir`: List files inside an approved root.
- `run_script`: Execute a script from `approved_scripts.json` by script id.

## Security Notes

This MVP blocks unrestricted shell execution, limits remote actions to allowlisted task types,
and enforces signed command envelopes (HMAC + nonce) before task execution.

## Project Docs

- `docs/USAGE.md` for command examples.
- `docs/SECURITY.md` for current controls and next hardening steps.
- `docs/MULTI_AGENT_ASSIGNMENT.md` for team ownership mapping.
- `docs/PROJECT_TODO.md` for completed vs remaining scope.

## Dev

- Format: `black .`
- Lint: `ruff check .`
- Type-check: `mypy server/agent_api agent/local_agent shared`
- Test: `pytest`
