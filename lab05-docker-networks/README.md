# Lab 05 — Docker Networks

## Goal

Understand how containers communicate with each other over Docker networks, why custom bridge networks provide automatic DNS resolution by container name, and how this differs from the default `bridge` network.

## What I did

### Part 1 — Default networks

```
docker network ls
```
Confirmed Docker's built-in networks: `bridge` (default), `host`, and `none`.

### Part 2 — Custom network with name-based DNS resolution

```
docker network create lab05-network

docker run -d --name container-a --network lab05-network alpine sleep 3600
docker run -d --name container-b --network lab05-network alpine sleep 3600

docker exec -it container-a sh
# inside container:
ping -c 3 container-b
exit
```
Result: `container-a` successfully pinged `container-b` **by name**, which Docker resolved to its internal IP (`172.21.0.3`). No manual IP configuration needed.

### Part 3 — Default bridge network has no DNS resolution

```
docker run -d --name container-c alpine sleep 3600
# container-c is NOT attached to lab05-network — it lands on the default bridge

docker exec -it container-a sh
ping -c 3 container-c
exit
```
Result: `ping: bad address 'container-c'` — `container-a` (on `lab05-network`) and `container-c` (on the default `bridge`) are isolated from each other and can't resolve each other by name.

### Part 4 — Connecting a running container to another network

```
docker network connect lab05-network container-c

docker exec -it container-a sh
ping -c 3 container-c
exit
```
Result: ping succeeded — containers can be attached to additional networks at runtime, not just at creation.

### Part 5 — Inspecting a network

```
docker network inspect lab05-network
```
Showed all three containers attached, each with their assigned IP on the `172.21.0.0/16` subnet (auto-assigned by Docker).

### Cleanup

```
docker stop container-a container-b container-c
docker rm container-a container-b container-c
docker network rm lab05-network
```

## Key concepts

- **Default `bridge` network has no automatic DNS.** Containers on it can only reach each other by IP, and every container started without `--network` lands here together — not great for isolation between unrelated projects.
- **Custom (user-defined) bridge networks provide built-in DNS resolution.** Containers on the same custom network can reach each other using their container name instead of an IP address. This is the mechanism Docker Compose relies on (Lab 07) — e.g. a backend service connecting to a database using the service name `db` rather than a hardcoded IP.
- **Containers can join multiple networks**, and networks can be joined after the container is already running, via `docker network connect <network> <container>`.
- **`docker network inspect`** shows all containers attached to a network along with their assigned IPs — useful for debugging connectivity issues between containers.
- **Custom subnets** can be specified explicitly with `docker network create --subnet <CIDR> <name>`, useful when avoiding IP range conflicts in more complex setups (e.g. multiple Docker networks alongside a cloud VPC).

## Commands reference

| Command | Purpose |
|---|---|
| `docker network ls` | List all networks |
| `docker network create <name>` | Create a custom bridge network |
| `docker run --network <name> ...` | Attach a container to a specific network at creation |
| `docker network connect <network> <container>` | Attach a running container to an additional network |
| `docker network inspect <name>` | Show detailed network info, including attached containers and their IPs |
| `docker network rm <name>` | Delete a network |

## Notes

This lab is the foundation for Lab 06 (multi-container apps) and Lab 07 (Docker Compose) — both rely on containers finding each other by name over a shared custom network rather than hardcoded IPs.
