# Lab 06 — Multi-Container Apps

## Goal

Manually connect a backend service to a database container using a custom network — no Docker Compose yet. The goal is to understand exactly what Compose automates before using it in Lab 07.

## What I did

1. Created a custom network and ran a PostgreSQL container on it:
   ```
   docker network create lab06-network
   docker run -d --name lab06-db --network lab06-network -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=labdb -p 5432:5432 postgres:16-alpine
   ```
2. Wrote a Node.js backend (`app.js`) that connects to PostgreSQL using `pg`, addressing the database **by container name** (`host: 'lab06-db'`) instead of an IP address:
   ```javascript
   const client = new Client({
     host: 'lab06-db',
     port: 5432,
     user: 'postgres',
     password: 'mysecretpassword',
     database: 'labdb',
   });
   ```
3. Wrote a Dockerfile that installs dependencies in a separate, cache-friendly layer (see "Layer caching" below).
4. Built and ran the backend on the same network:
   ```
   docker build -t lab06-backend .
   docker run -d --name lab06-backend --network lab06-network -p 3000:3000 lab06-backend
   ```
5. Verified the connection: `http://localhost:3000` returned `Backend is running. Database time: ...`, confirming the backend successfully queried PostgreSQL through the container network using just its name.
6. Cleaned up:
   ```
   docker stop lab06-backend lab06-db
   docker rm lab06-backend lab06-db
   docker network rm lab06-network
   ```

## Key concepts

- **Cross-container communication relies entirely on the custom network's DNS resolution** introduced in Lab 05. The backend never needed to know the database's IP — just its container name.
- This is the manual version of what Docker Compose automates in Lab 07: Compose creates a shared network for all services in a `docker-compose.yml` file and lets them reach each other by service name, the same way `lab06-backend` reached `lab06-db`.

## Layer caching — why dependency files are copied before app code

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY app.js .
EXPOSE 3000
CMD ["node", "app.js"]
```

Docker caches each instruction as a layer. On a rebuild, it walks the Dockerfile top to bottom and reuses cached layers **until it finds a changed instruction** — from that point on, every subsequent layer is rebuilt, even if its own inputs didn't change.

**With this ordering** (dependency file copied first, app code last): changing only `app.js` invalidates just the final `COPY` layer. `npm install` is skipped entirely and served from cache, since `package.json` didn't change.

**A common shortcut seen in many sample Dockerfiles** uses a single `COPY . .` instead:
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
CMD ["node", "app.js"]
```
This copies everything — code and dependency manifests — in one layer. Any code change invalidates that entire layer, and if dependency installation depended on it, it would rerun every time, even when `package.json` hadn't changed. It also tends to assume `node_modules` already exists outside the container, which works for quick demos but isn't self-contained.

**The rule:** order Dockerfile instructions from least-frequently-changed to most-frequently-changed. Dependency manifests rarely change; application code changes constantly — so manifests go first, code goes last, keeping the cache chain intact as long as possible.

## Commands reference

| Command | Purpose |
|---|---|
| `docker network create <name>` | Create a custom network for inter-container communication |
| `docker run -e KEY=value ...` | Pass environment variables into a container (used here for DB credentials — will be handled more securely in Lab 08) |
| `docker build -t <name> .` | Build an image, respecting layer cache where possible |

## Notes

The database password is hardcoded in plain text here for simplicity. Lab 08 (Environment Variables and Secrets) replaces this with a safer approach using `.env` files.
