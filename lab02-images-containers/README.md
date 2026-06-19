# Lab 02 — Images and Containers

## Goal

Understand how Docker images are built from layers, how layer caching works, and the difference between creating and starting a container — i.e. the container lifecycle.

## What I did

1. Pulled and inspected a minimal image's layer history:
   ```
   docker pull alpine
   docker history alpine
   ```
2. Compared it against a more complex image to see how layers stack up:
   ```
   docker history nginx
   ```
3. Separated `docker run` into its two underlying steps — create, then start:
   ```
   docker create --name lab02-test alpine echo "helloo docker"
   docker ps -a
   docker start -a lab02-test
   docker ps -a
   ```
4. Inspected full container metadata as JSON:
   ```
   docker inspect lab02-test
   ```
5. Cleaned up:
   ```
   docker rm lab02-test
   ```

## Key concepts

- **Image layers**: every instruction in a Dockerfile (`RUN`, `COPY`, `ENV`, etc.) creates a layer. `docker history` shows them in order, oldest at the bottom.
- **Layer caching**: unchanged layers are reused on rebuild. Layers that rarely change should be placed earlier in a Dockerfile; layers that change often (like application code) should go last — this minimizes rebuild time. Directly relevant to Lab 10 (build optimization).
- **`alpine` vs `nginx` layer count**: alpine has 2 layers (~13MB total) because it's just a minimal root filesystem. nginx has 18 layers (~241MB) because it installs packages, copies config scripts, and sets runtime metadata (`ENTRYPOINT`, `EXPOSE`, `CMD`).
- **`docker run` = `docker create` + `docker start`**: `create` allocates a container in the `Created` state without running anything. `start` actually executes the container's command. `docker run` does both in one step, which is why it's used almost everywhere in practice.
- **Exit codes**: `ExitCode: 0` means the container's process completed successfully. Non-zero codes (seen on some old leftover containers, e.g. `Exited (1)`, `Exited (255)`) indicate an error during execution — useful for debugging in Lab 09.

## Commands reference

| Command | Purpose |
|---|---|
| `docker history <image>` | Show the layer-by-layer build history of an image |
| `docker create --name <name> <image> <cmd>` | Create a container without starting it |
| `docker start -a <name>` | Start a container and attach to its output |
| `docker inspect <container>` | Full JSON metadata: state, network, mounts, env vars |
| `docker rm <name>` | Remove a stopped container |

## Notes

`docker inspect` is the deepest debugging tool in this set — its `State` block (Status, ExitCode, StartedAt, FinishedAt) is the first place to look when a container isn't behaving as expected. Will revisit this more thoroughly in Lab 09.
