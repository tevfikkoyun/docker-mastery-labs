# docker-mastery-labs

Hands-on Docker labs from fundamentals to a production-style multi-container deployment.

Each lab builds on the last — starting with core Docker concepts, working up through networking, Compose, secrets management, CI/CD, and finishing with a production-hardened setup complete with a real debugging session and a measured security improvement.

## Labs

| Lab | Topic |
|---|---|
| [Lab 01](./lab01-fundamentals) | Docker Fundamentals |
| [Lab 02](./lab02-images-containers) | Images and Containers |
| [Lab 03](./lab03-dockerfile-basics) | Dockerfile Basics |
| [Lab 04](./lab04-volumes-bind-mounts) | Volumes and Bind Mounts |
| [Lab 05](./lab05-docker-networks) | Docker Networks |
| [Lab 06](./lab06-multi-container-apps) | Multi-Container Apps |
| [Lab 07](./lab07-docker-compose) | Docker Compose |
| [Lab 08](./lab08-env-secrets) | Environment Variables and Secrets |
| [Lab 09](./lab09-logs-exec-debugging) | Container Logs, Exec, Debugging |
| [Lab 10](./lab10-build-optimization) | Build Optimization and .dockerignore |
| [Lab 11](./lab11-docker-registry-cicd) | Docker Registry, Docker Hub, and CI/CD |
| [Lab 12](./lab12-production-ready) | Production-Ready Docker Setup |

Each lab folder has its own `README.md` documenting the goal, commands run, and key concepts learned.

## Highlights

- **~8x image size reduction** (1.58GB → 194MB) through multi-stage builds and alpine base images — [Lab 10](./lab10-build-optimization)
- **Automated CI/CD pipeline**: every push triggers a GitHub Actions workflow that builds and pushes a Docker image to Docker Hub using secrets-based authentication — [Lab 11](./lab11-docker-registry-cicd)
- **Real production debugging**: a Docker healthcheck caught an application bug where a hung database query was silently blocking every HTTP request — diagnosed end-to-end using `docker logs`, `docker inspect`, and manual reproduction inside the container — [Lab 12](./lab12-production-ready)
- **Vulnerability count cut from 24 to 8 findings** (1 Critical → 0, 19 High → 1) by upgrading the base image from `node:20-alpine` to `node:24-alpine`, verified with `docker scout` — [Lab 12](./lab12-production-ready)

## What's next

A final project — a Dockerized full-stack application (React/HTML frontend, Node.js backend, Postgres database, Nginx reverse proxy, Docker Compose orchestration) — builds directly on the patterns established in these labs.