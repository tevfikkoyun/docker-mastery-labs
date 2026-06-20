# Lab 11 — Docker Registry, Docker Hub, and CI/CD

## Goal

Push an image to Docker Hub manually first, then automate the same process with GitHub Actions — so every push to `main` builds and pushes the image automatically, with credentials handled securely via GitHub Secrets.

## What I did

### Part 1 — Manual push to Docker Hub

```
docker tag lab10-optimized tevfikkoyun/docker-mastery-labs:lab11
docker push tevfikkoyun/docker-mastery-labs:lab11
```
`docker tag` gives an existing image a second name in `username/repo:tag` format — required for Docker Hub to know where to route the push. Verified the image appeared on Docker Hub at 48.47 MB, matching the optimized size from Lab 10.

### Part 2 — Docker Hub access token

Created a Docker Hub access token (Read & Write scope) instead of using the account password directly — tokens can be scoped and revoked independently of the account credentials.

### Part 3 — GitHub Secrets

Added two repository secrets at `Settings → Secrets and variables → Actions`:
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

Same principle as Lab 08's `.env` file — sensitive values never appear in code or in the workflow YAML itself, only referenced by name.

### Part 4 — GitHub Actions workflow

`.github/workflows/docker-build-push.yml`:
```yaml
name: Build and Push Docker Image

on:
  push:
    branches:
      - main
    paths:
      - 'lab11-docker-registry-cicd/**'

jobs:
  build-and-push:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push image
        uses: docker/build-push-action@v6
        with:
          context: ./lab11-docker-registry-cicd
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/docker-mastery-labs:lab11-auto
```

### Part 5 — Verified the automation

Pushed the commit containing the workflow file. GitHub Actions triggered automatically:
- Workflow run completed successfully in **18 seconds**
- Docker Hub showed a new tag, `lab11-auto`, pushed automatically a few minutes after the manual `lab11` tag — same 48.47 MB size, confirming the automated build matched the manual one.

## Key concepts

- **`docker tag`** doesn't copy or rebuild an image — it just adds an additional reference (name) to the same image ID. An image can have multiple tags simultaneously.
- **Access tokens over passwords**: Docker Hub access tokens can be scoped (read-only vs read/write) and revoked individually without changing the account password — the same "least privilege" principle relevant to IAM credentials in AWS.
- **GitHub Secrets** keep credentials out of the repository entirely. They're referenced in workflow YAML via `${{ secrets.NAME }}` and are masked in workflow logs automatically.
- **`paths:` filter in the trigger** scopes the workflow to only run when files inside `lab11-docker-registry-cicd/` change — without it, every commit to any lab folder would rebuild and push this image unnecessarily.
- **`docker/login-action` and `docker/build-push-action`** are official, reusable GitHub Actions that wrap the equivalent `docker login`, `docker build`, and `docker push` CLI commands into a declarative pipeline step — the CI/CD equivalent of the manual workflow in Part 1.

## Commands reference

| Command | Purpose |
|---|---|
| `docker tag <image> <username>/<repo>:<tag>` | Add a Docker Hub-formatted name to an existing local image |
| `docker push <username>/<repo>:<tag>` | Upload a tagged image to Docker Hub |
| `docker login` | Authenticate the CLI with Docker Hub (used implicitly via Docker Desktop sign-in here) |

## Notes

This mirrors the GitHub Actions CI/CD pattern from the AWS Cloud Resume Challenge (S3/CloudFront deploy on push) — same trigger-on-push, secrets-based-auth, automated-build-and-publish shape, just targeting a container registry instead of a cloud storage bucket. Sets up directly for Lab 12 (production-ready setup) and the eventual AWS ECR bonus stage.
