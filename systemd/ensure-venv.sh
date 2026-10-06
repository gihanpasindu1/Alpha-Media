#!/bin/bash
# Ensure the backend venv exists and works. Rebuilds it if the VM was
# replaced or the venv got corrupted. Safe to run on every service start.
set -u
BACKEND_DIR="/home/hatch/workspace/tgbot/website/backend"
VENV="$BACKEND_DIR/venv"

if [ -x "$VENV/bin/python" ] && "$VENV/bin/python" -c "import fastapi, uvicorn" 2>/dev/null; then
    exit 0
fi

echo "[ensure-venv] (re)creating backend venv..."
rm -rf "$VENV"
python3 -m venv "$VENV"
"$VENV/bin/pip" install -q --upgrade pip
"$VENV/bin/pip" install -q -r "$BACKEND_DIR/requirements.txt"
"$VENV/bin/pip" install -q requests
echo "[ensure-venv] done"
