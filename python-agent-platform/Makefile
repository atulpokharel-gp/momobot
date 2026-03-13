.PHONY: api django agent test lint fmt typecheck

api:
	uvicorn server.agent_api.app.main:app --reload --port 8000

django:
	python server/control_plane/manage.py runserver 0.0.0.0:8100

agent:
	python -m agent.local_agent.app.main run

test:
	pytest

lint:
	ruff check .

fmt:
	black .

typecheck:
	mypy server/agent_api agent/local_agent shared
