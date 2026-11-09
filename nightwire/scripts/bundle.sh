#!/usr/bin/env bash
set -euo pipefail

VERSION=${1:-1.0.0}
OUT_DIR=dist
BUNDLE_NAME=nightwire-vertical-slice-$VERSION.zip

echo "[nightwire] building release bundle $VERSION"
npm run build

echo "[nightwire] creating bundle $BUNDLE_NAME"
cd "$OUT_DIR"
zip -r "../$BUNDLE_NAME" .
cd ..

echo "[nightwire] bundle created: $BUNDLE_NAME"
