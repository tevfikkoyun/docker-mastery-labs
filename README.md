# Lab 03 — Dockerfile Basics

## Goal

Write a Dockerfile from scratch to package a simple Node.js app into a custom image, understand the core Dockerfile instructions, and learn the practical difference between `CMD` and `ENTRYPOINT`.

## What I did

1. Wrote a minimal Node.js HTTP server (`app.js`) that responds with a plain text message on port 3000.
2. Wrote a Dockerfile to containerize it:
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY app.js .
   EXPOSE 3000
   CMD ["node", "app.js"]
   ```
3. Built and ran the image:
   ```
   docker build -t lab03-hello-app .
   docker run -d --name lab03-app -p 3000:3000 lab03-hello-app
   ```
   Verified the response at `http://localhost:3000` and via `docker logs lab03-app`.
4. Tested `CMD` override behavior:
   ```
   docker run --rm lab03-hello-app echo "this overrides CMD"
   ```
   Result: the `echo` command fully replaced `node app.js` — `CMD` is a default that `docker run` arguments can override entirely.
5. Temporarily swapped `CMD` for `ENTRYPOINT ["node", "app.js"]`, rebuilt, and repeated the same test:
   ```
   docker build -t lab03-entrypoint-test .
   docker run --rm lab03-entrypoint-test echo "this overrides CMD"
   ```
   Result: the `echo` arguments were appended to `node app.js` instead of replacing it — the actual command executed was `node app.js echo "this overrides CMD"`. The server started normally and ignored the extra args.
6. Cleaned up the test container/image and reverted the Dockerfile back to `CMD`.

## Key concepts

- **`FROM`** sets the base image. `node:20-alpine` was chosen for its small size (Alpine-based, as seen in Lab 02).
- **`WORKDIR`** sets the working directory inside the container for all subsequent instructions; creates the directory if it doesn't exist.
- **`COPY <host-path> <container-path>`** copies files from the build context (host) into the image.
- **`EXPOSE`** documents which port the container listens on. It does not publish the port — that's still done with `-p` at `docker run` time.
- **`CMD` vs `ENTRYPOINT`**:

| | `CMD` | `ENTRYPOINT` |
|---|---|---|
| Behavior with `docker run image <args>` | `<args>` **replace** the entire command | `<args>` are **appended** to the entrypoint command |
| Use case | Default command that should stay easily overridable | Container behaves like a fixed executable; args customize its behavior |

  They can be combined: `ENTRYPOINT ["node"]` + `CMD ["app.js"]` makes `app.js` a default argument that can still be swapped out with `docker run image other.js`, while `node` itself stays fixed. Common in production setups.

- Layer caching was visible in the second build (`lab03-entrypoint-test`): `WORKDIR` and `COPY` steps showed `CACHED` since only the Dockerfile's last line changed.

## Commands reference

| Command | Purpose |
|---|---|
| `docker build -t <name> .` | Build an image from a Dockerfile in the current directory |
| `docker run -d --name <name> -p <host>:<container> <image>` | Run a built image as a background container |
| `docker run --rm <image> <override-cmd>` | Run once, auto-remove after exit, override CMD |
| `docker rmi <image>` | Remove an image |

## Notes

`--rm` only removes the container once it actually stops. If a process inside ignores `SIGTERM` (as happened here when extra args got passed to `node app.js` and it kept running), the container stays alive until force-stopped — at which point `--rm` kicks in and removes it automatically.