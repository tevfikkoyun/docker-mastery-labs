# Lab 08 — Environment Variables and Secrets

## Goal

Fix the hardcoded database password from Labs 06 and 07 by moving sensitive values into a `.env` file, kept out of version control by `.gitignore`, and have both `docker-compose.yml` and the application code read from environment variables instead.

## What I did

1. Reused the backend from Lab 07 (`app.js`, `package.json`, `Dockerfile`).
2. Created a `.env` file with the real credentials:
   ```
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=mysecretpassword
   POSTGRES_DB=labdb
   ```
3. Updated `docker-compose.yml` to reference these values instead of hardcoding them:
   ```yaml
   services:
     db:
       image: postgres:16-alpine
       environment:
         POSTGRES_USER: ${POSTGRES_USER}
         POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
         POSTGRES_DB: ${POSTGRES_DB}
       ports:
         - "5432:5432"
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
         interval: 5s
         timeout: 5s
         retries: 5

     backend:
       build: .
       ports:
         - "3000:3000"
       environment:
         DB_USER: ${POSTGRES_USER}
         DB_PASSWORD: ${POSTGRES_PASSWORD}
         DB_NAME: ${POSTGRES_DB}
       depends_on:
         db:
           condition: service_healthy
   ```
4. Updated `app.js` to read credentials from `process.env` instead of hardcoding them:
   ```javascript
   const client = new Client({
     host: 'db',
     port: 5432,
     user: process.env.DB_USER,
     password: process.env.DB_PASSWORD,
     database: process.env.DB_NAME,
   });
   ```
5. Ran `docker compose up` — connected successfully on the first try (no password visible anywhere in the YAML or JS files).
6. **Verified `.env` is actually excluded from git**:
   ```
   git check-ignore -v .env
   # → .gitignore:69:.env    .env
   ```
   Then confirmed with `git add .` / `git status` that `.env` never appeared in the staged files — only `app.js`, `docker-compose.yml`, `dockerfile`, and `package.json` were tracked.
7. Added a `.env.example` file (committed to the repo) with placeholder values, documenting which variables are required without exposing real credentials:
   ```
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=changeme
   POSTGRES_DB=labdb
   ```
8. Cleaned up: `docker compose down`

## Key concepts

- **Compose automatically reads a `.env` file** in the same directory as `docker-compose.yml` — no extra configuration needed. Values are referenced in the YAML with `${VARIABLE_NAME}` syntax.
- **`.gitignore` already covered `.env`** thanks to the Node template used when the repo was created (`.env` and `.env.*` are excluded, with an explicit exception for `.env.example`). Verified this directly with `git check-ignore -v .env` rather than just assuming it worked.
- **Application code reads secrets via `process.env`**, not hardcoded values. This means the same Docker image can run in different environments (dev, staging, production) with different `.env` files — no code or image rebuild required.
- **`.env.example` is a documentation pattern**, not a secret. It's committed to the repo so anyone cloning it knows which environment variables to set, without ever seeing real credentials.

## Commands reference

| Command | Purpose |
|---|---|
| `git check-ignore -v <file>` | Confirm a file is excluded by `.gitignore`, and show which rule matched |
| `git status --porcelain` | Compact view of changed/untracked files |

## Notes

This pattern — `.env` for real values (never committed), `.env.example` for documentation (always committed), and application code reading from `process.env` — is the standard approach for managing secrets in containerized applications, both locally and as a stepping stone toward proper secret managers (AWS Secrets Manager, Docker Secrets, etc.) in more advanced production setups.
