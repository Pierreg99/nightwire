#!/usr/bin/env bash
set -euo pipefail

HOST=${DEPLOY_HOST:-}
USER=${DEPLOY_USER:-root}
REMOTE_DIR=${DEPLOY_DIR:-/opt/nightwire}

if [[ -z "$HOST" ]]; then
  echo "Usage: DEPLOY_HOST=your-server ./scripts/deploy.sh"
  exit 1
fi

echo "[nightwire] building production bundle"
./scripts/build.sh

echo "[nightwire] deploying to $HOST:$REMOTE_DIR"
ssh "$USER@$HOST" "mkdir -p '$REMOTE_DIR'"
rsync -az --delete dist/ "$USER@$HOST:$REMOTE_DIR/"

echo "[nightwire] deployment complete"
