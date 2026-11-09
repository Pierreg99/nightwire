#!/usr/bin/env bash
set -euo pipefail

TAG=${1:-}

if [[ -z "$TAG" ]]; then
  echo "Usage: ./scripts/release.sh <tag>"
  exit 1
fi

echo "[nightwire] creating release $TAG"
git tag "$TAG"
git push origin "$TAG"

echo "[nightwire] release $TAG created"
