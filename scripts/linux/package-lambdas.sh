#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LAMBDA_DIR="$ROOT_DIR/lambdas"
BUILD_DIR="$ROOT_DIR/.deploy/lambda-build"
OUT_DIR="$ROOT_DIR/.deploy/lambda-zips"
REQ_FILE="$ROOT_DIR/backend/requirements.txt"
rm -rf "$BUILD_DIR" "$OUT_DIR"
mkdir -p "$BUILD_DIR" "$OUT_DIR"
for src in "$LAMBDA_DIR"/*.py; do
  name="$(basename "$src" .py)"
  work="$BUILD_DIR/$name"
  mkdir -p "$work"
  cp "$src" "$work/"
  if [[ -f "$REQ_FILE" && "$name" == "generateAgoraToken" ]]; then
    python3 -m pip install -r "$REQ_FILE" -t "$work" --quiet
  fi
  (cd "$work" && zip -qr "$OUT_DIR/$name.zip" .)
  echo "Packaged $name.zip"
done
echo "Lambda zips written to $OUT_DIR"
