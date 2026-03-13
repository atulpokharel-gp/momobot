from __future__ import annotations

from fastapi.testclient import TestClient

from server.agent_api.app.db import Base, engine
from server.agent_api.app.main import app

client = TestClient(app)


def setup_function() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_full_command_flow() -> None:
    register_response = client.post(
        "/v1/devices/register",
        headers={"X-Registration-Token": "register-me"},
        json={"device_name": "dev-laptop", "fingerprint": "fingerprint-001"},
    )
    assert register_response.status_code == 200
    reg = register_response.json()

    issue_response = client.post(
        "/v1/commands",
        headers={"X-Operator-Token": "operator-me"},
        json={
            "device_id": reg["device_id"],
            "task_type": "echo",
            "payload": {"message": "hello"},
        },
    )
    assert issue_response.status_code == 200
    command = issue_response.json()

    next_response = client.get(
        f"/v1/devices/{reg['device_id']}/commands/next",
        headers={"Authorization": f"Bearer {reg['access_token']}"},
    )
    assert next_response.status_code == 200
    leased = next_response.json()["command"]
    assert leased["command_id"] == command["command_id"]
    assert leased["status"] == "leased"
    assert leased["nonce"]
    assert leased["signature"]

    result_response = client.post(
        f"/v1/commands/{command['command_id']}/result",
        headers={"Authorization": f"Bearer {reg['access_token']}"},
        json={"success": True, "output": "ok", "error": ""},
    )
    assert result_response.status_code == 200
    done = result_response.json()
    assert done["status"] == "completed"


def test_operator_auth_required() -> None:
    response = client.post(
        "/v1/commands",
        headers={"X-Operator-Token": "wrong"},
        json={
            "device_id": "00000000-0000-0000-0000-000000000000",
            "task_type": "echo",
            "payload": {},
        },
    )
    assert response.status_code == 401
