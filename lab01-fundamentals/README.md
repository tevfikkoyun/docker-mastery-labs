# Lab 01 — Docker Fundamentals

## Goal

Understand Docker's core architecture and run a first container to see how images, containers, and the Docker daemon relate to each other — and how containers differ from virtual machines.

## What I did

1. Ran an nginx container in detached mode, mapping host port 8080 to container port 80:
   ```
   docker run -d --name lab01-nginx -p 8080:80 nginx
   ```
2. Verified it was running and inspected logs:
   ```
   docker ps
   docker logs lab01-nginx
   ```
3. Opened a shell inside the running container to inspect its isolated filesystem:
   ```
   docker exec -it lab01-nginx bash
   ```
4. Cleaned up:
   ```
   docker stop lab01-nginx
   docker rm lab01-nginx
   ```

## Key concepts

- **Image vs container**: an image is a read-only template; a container is a running instance of that image.
- **Containers share the host kernel** — unlike VMs, which each run a full guest OS on top of a hypervisor. This is why containers start in seconds and are megabytes instead of gigabytes.
- **Port mapping** (`-p host:container`) connects a port on the host machine to a port inside the container's isolated network namespace.
- **`docker exec`** opens a shell inside an already-running container's isolated filesystem — it does not create a new container or SSH into a VM.

## Commands reference

| Command | Purpose |
|---|---|
| `docker run -d --name <name> -p <host>:<container> <image>` | Start a container in the background with port mapping |
| `docker ps` | List running containers |
| `docker ps -a` | List all containers, including stopped ones |
| `docker logs <name>` | View container output/logs |
| `docker exec -it <name> bash` | Open an interactive shell inside a running container |
| `docker stop <name>` | Stop a running container |
| `docker rm <name>` | Remove a stopped container |
| `docker images` | List locally available images |

## Notes

Containers are not lightweight VMs — they're isolated processes on the host's existing kernel, using Linux namespaces and cgroups for isolation. That's the core reason for their speed and small footprint compared to traditional virtualization.
