# Max-out

Max-out is a React and FastAPI lifting tracker. The local demo uses a SQLite
database at `backend/maxout.db` and starts with no accounts on a fresh checkout.

## Run the local demo

Use Python 3.11 and Node.js 22.12 or newer.

```bash
make setup   # First run, or after dependencies change
make demo
```

Open [http://127.0.0.1:8001](http://127.0.0.1:8001) and sign up for a new account.
One process serves the compiled frontend and the API. Press Ctrl+C to stop it.
The database persists between runs. Uvicorn does not write a log file or print
request access logs. Warnings and errors still appear in the terminal.

To start over, stop the server and remove the local `backend/maxout.db` file.
This deletes all local accounts and their data. The next startup recreates the
empty database and loads the upgrade catalog.

## Develop with Vite

For frontend hot reload, run `make backend-dev` and `make frontend-dev` in
separate terminals and open [http://127.0.0.1:5173](http://127.0.0.1:5173).
Vite forwards `/api` requests to FastAPI. If you have an older
`frontend/.env.local`, remove its direct backend URL or set `VITE_API_URL=/api`.
The standalone API docs are at [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs).

The backend loads `backend/.env` if present. Set `DATABASE_URL` there only if
you want to override the default database.

## Optional Docker setup

Set a strong, URL-safe `POSTGRES_PASSWORD` in the project root's ignored
`.env` file and run `docker compose up --build`. Open
[http://127.0.0.1:5173](http://127.0.0.1:5173). Docker uses its own Postgres
volume. An existing Postgres volume retains its original roles and credentials.

## Hosting

`make demo` is configured for HTTP on loopback. For deployment, serve the
frontend and API on the same HTTPS origin, set `MAXOUT_HOSTS` to the deployment
hostname and leave `MAXOUT_LOCAL_HTTP` unset so session cookies require HTTPS.
If using a reverse proxy, preserve the public Host and trust forwarded headers
only from that proxy. Use a shared rate limiter at the proxy or gateway when
running multiple API workers. The application's auth throttle is per process.
