#!/bin/bash
# Ensure the backend venv exists and works. Restores from backup tarball
# if available (fast), otherwise rebuilds via pip (slow). Safe to run
# on every service start.
set -u
BACKEND_DIR="/home/hatch/workspace/tgbot/website/backend"
VENV="$BACKEND_DIR/venv"
BACKUP="/home/hatch/workspace/tgbot/systemd/venv-backup.tar.gz"

if [ -x "$VENV/bin/python" ] && "$VENV/bin/python" -c "import fastapi, uvicorn" 2>/dev/null; then
    exit 0
fi

echo "[ensure-venv] venv missing/broken, restoring..."
if [ -f "$BACKUP" ]; then
    echo "[ensure-venv] extracting backup (fast)..."
    rm -rf "$VENV"
    tar -xzf "$BACKUP" -C "$BACKEND_DIR"
    if [ -x "$VENV/bin/python" ] && "$VENV/bin/python" -c "import fastapi, uvicorn" 2>/dev/null; then
        echo "[ensure-venv] restored from backup"
        exit 0
    fi
    echo "[ensure-venv] backup restore failed, falling back to pip"
fi

echo "[ensure-venv] rebuilding via pip (slow)..."
rm -rf "$VENV"
python3 -m venv "$VENV"
"$VENV/bin/pip" install -q --upgrade pip
"$VENV/bin/pip" install -q -r "$BACKEND_DIR/requirements.txt"
"$VENV/bin/pip" install -q requests
echo "[ensure-venv] done"
