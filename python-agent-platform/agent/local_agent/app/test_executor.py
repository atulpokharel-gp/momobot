from __future__ import annotations

from shared.schemas.agent_protocol import TaskType

from .executor import Executor


def test_echo_executor() -> None:
    exe = Executor()
    success, output, error = exe.execute(TaskType.ECHO, {"message": "hello"})
    assert success is True
    assert output == "hello"
    assert error == ""
