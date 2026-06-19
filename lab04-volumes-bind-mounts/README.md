# Lab 04 — Volumes and Bind Mounts

## Goal

Understand how to persist data beyond a container's lifecycle using named volumes, and how to share live files between host and container using bind mounts.

## What I did

### Part 1 — The problem: data loss without persistence

```
docker run -it --name temp-test alpine sh
# inside container:
echo "this data will be lost" > /data.txt
cat /data.txt
exit

docker rm temp-test
docker run --rm alpine cat /data.txt
# Result: "No such file or directory" — confirms each container starts
# from a clean copy of the image; nothing from a previous container carries over.
```

### Part 2 — Named volumes

```
docker volume create lab04-data

docker run -it --name vol-test -v lab04-data:/data alpine sh
# inside container:
echo "this data will survive" > /data/persist.txt
cat /data/persist.txt
exit

docker rm vol-test
docker run --rm -v lab04-data:/data alpine cat /data/persist.txt
# Result: file content is still there, even though vol-test was fully deleted.
```

`-v <volume_name>:<container_path>` mounts a Docker-managed volume into the container. The volume's lifecycle is independent of any container — Docker stores it outside the container's writable layer, and any container can reattach to it by name.

### Part 3 — Bind mounts

```
mkdir host-folder
"edited from host" | Out-File -FilePath host-folder\note.txt -Encoding utf8

docker run -it --name bind-test -v "${PWD}\host-folder:/data" alpine sh
# inside container:
cat /data/note.txt
echo "edited from container" >> /data/note.txt
exit

cat host-folder\note.txt
# Result: both lines present — the container wrote directly into the host folder.
```

`-v <host_path>:<container_path>` maps an existing host directory directly into the container. Unlike a named volume, both sides see the same files in real time — this is the mechanism behind live code reload in development setups.

### Cleanup

```
docker rm bind-test
docker volume rm lab04-data
```

## Key concepts

- **Containers are ephemeral by default.** Anything written inside a container's writable layer is lost when the container is removed.
- **Named volumes** (`-v volume_name:/path`) are managed by Docker and persist independently of any single container. Best for data that needs to survive container restarts/replacements but doesn't need direct host access — e.g. database files.
- **Bind mounts** (`-v /host/path:/container/path`) link an existing host directory directly into the container. Best for development — edit code on the host, see changes immediately inside the container.
- **Volume vs bind mount, when to use which**:

| | Named volume | Bind mount |
|---|---|---|
| Managed by | Docker | The host filesystem directly |
| Typical use | Production data persistence (databases) | Local development (live code sync) |
| Host visibility | Not directly browsable | Fully visible at the host path |

## Troubleshooting note — encoding mismatch

Writing a file on Windows with `echo "text" > file.txt` in PowerShell defaults to **UTF-16LE** encoding. When that file was read inside the Alpine container (which expects UTF-8), the output was garbled (`摥瑩摥...`). Fixed by writing the file with explicit UTF-8 encoding:

```
"edited from host" | Out-File -FilePath host-folder\note.txt -Encoding utf8
```

Worth remembering for any future bind mount work on Windows — this is a common gotcha when host (Windows/PowerShell) and container (Linux) tools disagree on default text encoding.

## Commands reference

| Command | Purpose |
|---|---|
| `docker volume create <name>` | Create a named volume |
| `docker run -v <volume>:<path> <image>` | Mount a named volume into a container |
| `docker run -v "${PWD}\folder:/path" <image>` | Bind mount a host folder into a container (PowerShell) |
| `docker volume rm <name>` | Delete a named volume |
| `docker volume ls` | List all volumes |
