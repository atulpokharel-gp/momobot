from __future__ import annotations

from shared.schemas.signing import build_command_signature


def test_build_command_signature_is_stable_for_sorted_payload() -> None:
    left = build_command_signature(
        command_id="c1",
        device_id="d1",
        task_type="echo",
        payload={"b": 2, "a": 1},
        nonce="n1",
        secret="s1",
    )
    right = build_command_signature(
        command_id="c1",
        device_id="d1",
        task_type="echo",
        payload={"a": 1, "b": 2},
        nonce="n1",
        secret="s1",
    )
    assert left == right

