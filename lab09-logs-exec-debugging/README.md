# Lab 09 — Container Logs, Exec, Debugging

## Goal

Practice a real debugging workflow: deliberately break a container, diagnose why it failed using logs and inspect, fix it, then verify the fix and inspect runtime behavior on the working container.

## What I did

### Part 1 — Deliberately broken container

Wrote `app.js` to fail fast if a required environment variable is missing:
```javascript
const requiredVar = process.env.REQUIRED_API_KEY;

if (!requiredVar) {
  console.error('FATAL: REQUIRED_API_KEY environment variable is not set');
  process.exit(1);
}
```

Built and ran it **without** setting the variable:
```
docker build -t lab09-debug-app .
docker run -d --name lab09-broken lab09-debug-app
docker ps -a
```
Result: container showed `Exited (1)`.

### Part 2 — Diagnosing the failure

```
docker logs lab09-broken
# → FATAL: REQUIRED_API_KEY environment variable is not set

docker inspect lab09-broken --format='{{.State.ExitCode}}'
# → 1
```

`docker logs` is the first place to look when a container exits unexpectedly — in this case it directly explained the cause. `docker inspect --format` pulls a single field out of the full JSON output (the same `State.ExitCode` field explored in Lab 02), which is faster than scanning the entire inspect output by hand.

### Part 3 — Fixing it and verifying

```
docker rm lab09-broken
docker run -d --name lab09-working -e REQUIRED_API_KEY=test-key-123 -p 3000:3000 lab09-debug-app
docker ps
```
Result: container stayed `Up`.

### Part 4 — Live debugging inside a running container

```
docker exec -it lab09-working sh
env | grep REQUIRED_API_KEY
ps aux
exit
```
Confirmed the environment variable was actually set inside the container, and saw the running process list — `node app.js` as PID 1 (the container's main process; if PID 1 exits, the container exits).

### Part 5 — Resource usage

```
docker stats --no-stream
```
Showed live CPU and memory usage per container without the continuously-refreshing live view (`--no-stream` takes a single snapshot instead).

### Cleanup
```
docker stop lab09-working
docker rm lab09-working
docker rmi lab09-debug-app
```

## Key concepts

- **`docker logs` first, always.** When a container exits unexpectedly, application output is usually the fastest way to find the cause — especially when the app fails fast and logs a clear error before exiting, as designed here.
- **`docker inspect --format='{{...}}'`** extracts a specific field from the full JSON inspect output using Go template syntax, instead of requiring a manual scan through the whole structure.
- **`docker exec -it <container> sh`** is for live inspection of a *running* container — checking environment variables, running processes, file contents, etc. while the app is actually up. Different use case from `docker logs` (historical output) and `docker inspect` (metadata/state).
- **PID 1 inside a container is the main process.** If it exits (cleanly or via a crash), the container stops — this is why `process.exit(1)` on a missing config value caused the entire container to exit, not just the request that needed it.
- **`docker stats --no-stream`** gives a quick resource snapshot (CPU%, memory usage/limit, network and block I/O) — useful both for sanity-checking a container's footprint and for spotting one that's consuming unexpectedly high resources.

## Commands reference

| Command | Purpose |
|---|---|
| `docker logs <container>` | View container output — first stop when debugging a failure |
| `docker inspect <container> --format='{{.State.ExitCode}}'` | Extract a specific field from inspect output |
| `docker exec -it <container> sh` | Open a live shell inside a running container |
| `docker stats --no-stream` | One-time snapshot of CPU/memory/network usage per container |
| `ps aux` (inside container) | List processes running inside the container |

## Notes

This lab models the actual sequence used to debug a failing container in practice: check logs → check exit code/state → fix → verify it's running → exec in to confirm runtime state matches expectations. Worth keeping as a mental checklist for production incidents.