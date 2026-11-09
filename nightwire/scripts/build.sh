#!/usr/bin/env bash
set -euo pipefail

echo "[nightwire] installing dependencies"
npm ci

echo "[nightwire] running production build"
npm run build

echo "[nightwire] build complete"
