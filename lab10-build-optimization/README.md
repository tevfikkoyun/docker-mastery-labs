# Lab 10 — Build Optimization and .dockerignore

## Goal

Compare a naively-built image against an optimized one, using a non-alpine base, `.dockerignore`, and multi-stage builds, and measure the actual size difference.

## What I did

### Part 1 — Naive build (intentionally unoptimized)

`Dockerfile.naive`:
```dockerfile
FROM node:20
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "app.js"]
```

Two deliberate anti-patterns here: `node:20` (full Debian-based image, not alpine) and `COPY . .` (copies the entire build context in one layer, including anything not explicitly excluded).

```
docker build -f Dockerfile.naive -t lab10-naive .
docker images lab10-naive
```
Result: **1.58GB**.

### Part 2 — Added `.dockerignore`

```
node_modules
.git
.env
.env.example
*.md
Dockerfile.naive
```
Prevents these from ever entering the build context, regardless of what `COPY` instructions exist — the same exclusion concept as `.gitignore`, but applied to what Docker sends to the build process rather than what git tracks.

### Part 3 — Multi-stage build

`Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY app.js .

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app /app
EXPOSE 3000
CMD ["node", "app.js"]
```

Two stages: `builder` installs dependencies and prepares the app; the final stage starts fresh from a clean `node:20-alpine` and copies over **only** the finished `/app` directory via `COPY --from=builder`. Anything used only during the build (intermediate layers, build tools) never makes it into the final image.

```
docker build -t lab10-optimized .
docker images
```
Result: **194MB**.

### Comparison

| Image | Size |
|---|---|
| `lab10-naive` | 1.58GB |
| `lab10-optimized` | 194MB |

Roughly an **8x reduction** (~88% smaller) just from switching to an alpine base and separating the build stage from the runtime stage.

### Verified the optimized image still works

```
docker run -d --name lab10-test -p 3001:3000 -e DB_USER=postgres -e DB_PASSWORD=test -e DB_NAME=test lab10-optimized
docker logs lab10-test
```
Result: `Backend server running on port 3000` — the app started correctly. A `Database connection error: ENOTFOUND db` followed, but that's expected since no real `db` container was running; it confirms the optimization didn't break the app itself, just made it smaller.

### Cleanup
```
docker stop lab10-test
docker rm lab10-test
docker rmi lab10-naive
```
`lab10-optimized` was kept for reference/comparison.

## Key concepts

- **Base image choice matters a lot.** `node:20` (Debian-based) ships with compilers, system libraries, and tooling most apps never use at runtime. `node:20-alpine` strips this down to the minimum needed to run Node.js.
- **`.dockerignore` prevents unwanted files from ever reaching the build context** — independent of what `COPY` instructions say. Same purpose as `.gitignore`, different scope (Docker build vs. git tracking).
- **Multi-stage builds separate "what's needed to build" from "what's needed to run".** Compilers, dev dependencies, and intermediate artifacts can live in an early stage and never appear in the final image — only files explicitly copied via `COPY --from=<stage>` make it through.
- **Smaller images aren't just about disk space**: faster push/pull (relevant for Lab 11's registry work and any CI/CD pipeline), smaller attack surface (fewer system packages = fewer potential CVEs, relevant to Lab 12), and faster container startup in production.

## Commands reference

| Command | Purpose |
|---|---|
| `docker build -f <filename> -t <name> .` | Build using a non-default Dockerfile filename |
| `FROM <image> AS <stage-name>` | Name a build stage for later reference |
| `COPY --from=<stage> <src> <dest>` | Copy files from a named earlier stage into the current stage |
| `docker images <name>` | Check the size of a specific built image |

## Notes

`lab10-naive` was removed after comparison; `lab10-optimized` was kept locally as a reference point alongside the numbers documented here.