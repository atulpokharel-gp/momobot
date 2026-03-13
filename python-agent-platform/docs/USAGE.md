# API Quick Usage

## Run API

```bash
uvicorn server.agent_api.app.main:app --reload --port 8000
```

## Enroll Agent

```bash
python -m agent.local_agent.app.main enroll --device-name devbox --fingerprint device-fp-01
```

## Start Agent

```bash
python -m agent.local_agent.app.main run
```

## List Devices

```bash
python -m server.agent_api.app.operator_cli list-devices
```

## Issue Echo Command

```bash
python -m server.agent_api.app.operator_cli issue --device-id <uuid> --task-type echo --payload '{"message":"hello"}'
```
