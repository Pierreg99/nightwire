# Release & Deployment Pass v1

## Purpose

This pass prepares NIGHTWIRE for a reproducible release and deployment.

It adds build scripts, release tagging, Docker packaging and deployment documentation.

## Modules

- scripts/build.sh: install dependencies and build production bundle
- scripts/release.sh: create and push a release tag
- Dockerfile: multi-stage Node build and Nginx runtime
- docker-compose.yml: local container deployment
- .dockerignore: excludes unnecessary files from the build context

## Build

Run:

- chmod +x scripts/build.sh
- ./scripts/build.sh

This installs dependencies and creates the production build.

## Release

Run:

- chmod +x scripts/release.sh
- ./scripts/release.sh v1.0.0

This creates and pushes a Git tag.

## Docker

Build:

- docker build -t nightwire .

Run:

- docker compose up -d

Access:

- http://localhost:8080

## Deployment checklist

- Run QA smoke checks.
- Run the eight-minute vertical slice test.
- Confirm no crash, stuck objective or broken interaction.
- Confirm performance target on desktop and mobile.
- Build production bundle.
- Create release tag.
- Build Docker image.
- Deploy to VPS or container host.
- Verify the live URL.

## Next step

After deployment, monitor frame time, errors and user feedback. Then prepare the next content pass.
