# Lab 07 — Docker Compose

## Goal

Replace the manual multi-container setup from Lab 06 (separate `docker network create`, two `docker run` commands) with a single `docker-compose.yml` file and a single command. Understand what Compose automates, and run into — then fix — a real startup race condition along the way.

## What I did

1. Reused the backend from Lab 06 (`app.js`, `package.json`, `Dockerfile`), updating the database host from the hardcoded container name `lab06-db` to the Compose service name `db`.
2. Wrote an initial `docker-compose.yml`:
   ```yaml
   services:
     db:
       image: postgres:16-alpine
       environment:
         POSTGRES_PASSWORD: mysecretpassword
         POSTGRES_DB: labdb
       ports:
         - "5432:5432"

     backend:
       build: .
       ports:
         - "3000:3000"
       depends_on:
         - db
   ```
3. Ran it:
   ```
   docker compose up
   ```
4. **Hit a race condition**: `backend` logs showed `Database connection error: ECONNREFUSED` immediately after `Backend server running on port 3000`. The `db` container had started, but PostgreSQL was still running its internal initialization (creating directories, setting locale, etc.) and wasn't accepting connections yet. `depends_on` alone only guarantees *start order*, not *readiness*.
5. **Fixed it with a healthcheck**:
   ```yaml
   services:
     db:
       image: postgres:16-alpine
       environment:
         POSTGRES_PASSWORD: mysecretpassword
         POSTGRES_DB: labdb
       ports:
         - "5432:5432"
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U postgres"]
         interval: 5s
         timeout: 5s
         retries: 5

     backend:
       build: .
       ports:
         - "3000:3000"
       depends_on:
         db:
           condition: service_healthy
   ```
6. Re-ran `docker compose up`. This time, `backend` waited for `db`'s healthcheck to pass (`Container ... Healthy`) before starting, and connected successfully on the first try — no `ECONNREFUSED`.
7. Verified via `http://localhost:3000` and shut everything down cleanly:
   ```
   docker compose down
   ```

## Key concepts

- **Compose replaces manual orchestration.** Everything done by hand in Lab 06 — `docker network create`, two separate `docker run` commands with matching `--network` flags — is expressed declaratively in one YAML file and run with `docker compose up`.
- **Compose creates a default network automatically** for all services in the file (here, `lab07-docker-compose_default`), and services reach each other by **service name** — the same DNS-by-name mechanism from Lab 05/06, just automated. This is why `app.js` had to change its database host from `lab06-db` to `db`.
- **`depends_on` controls start order, not readiness.** Without a healthcheck, Compose only waits for the dependency container to *start* — not for the application inside it (PostgreSQL, in this case) to actually be ready to accept connections. This is a common source of intermittent startup failures in real multi-container setups.
- **`healthcheck` + `condition: service_healthy`** solves this properly: Docker periodically runs a test command inside the container (here, `pg_isready -U postgres`) and only marks it `healthy` once that test passes. `depends_on` can then wait for that specific state instead of just "started".
- **`docker compose down`** tears down everything Compose created — containers and the auto-generated network — in one command, mirroring how `up` created it.

## Commands reference

| Command | Purpose |
|---|---|
| `docker compose up` | Build (if needed) and start all services, attached to logs |
| `docker compose up -d` | Same, but detached (background) |
| `docker compose down` | Stop and remove all services and the network Compose created |
| `docker compose ps` | List running services in this Compose project |

## Notes

The database password is still hardcoded in plain text in `docker-compose.yml` — same gap noted in Lab 06. Lab 08 (Environment Variables and Secrets) addresses this with a proper `.env` file.
