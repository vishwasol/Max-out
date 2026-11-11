PYTHON ?= python3.11
UVICORN = .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --no-access-log --log-level warning --no-proxy-headers --no-server-header

.PHONY: setup demo backend-setup backend-dev frontend-setup frontend-dev

setup: backend-setup frontend-setup

demo:
	cd frontend && VITE_API_URL=/api npm run build
	cd backend && MAXOUT_DEMO=1 MAXOUT_LOCAL_HTTP=1 $(UVICORN)

backend-setup:
	cd backend && $(PYTHON) -m venv .venv
	cd backend && .venv/bin/pip install -r requirements.txt

backend-dev:
	cd backend && MAXOUT_LOCAL_HTTP=1 $(UVICORN)

frontend-setup:
	cd frontend && npm ci

frontend-dev:
	cd frontend && npm run dev -- --host 127.0.0.1 --port 5173
