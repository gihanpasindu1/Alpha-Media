#!/bin/bash
# AlphaMedia one-command deploy for a standard Ubuntu VPS (22.04/24.04).
# Installs everything, builds the frontend, and runs the backend 24/7 via systemd.
# On a normal VPS (no egress proxy), the Cloudflare quick tunnel works out of the box.
#
# Usage:
#   curl -sSL <raw-url>/deploy-vps.sh | sudo bash
#   or: sudo ./deploy-vps.sh [--with-tunnel] [--repo URL] [--branch NAME]
set -euo pipefail

REPO="https://github.com/sadun-akalanka-fodo/TGbot"
BRANCH="rebuild/self-hosted-backend"
WITH_TUNNEL=0
APP_DIR="/opt/alphamedia"

while [ $# -gt 0 ]; do
  case "$1" in
    --with-tunnel) WITH_TUNNEL=1 ;;
    --repo) REPO="$2"; shift ;;
    --branch) BRANCH="$2"; shift ;;
    --dir) APP_DIR="$2"; shift ;;
    *) echo "unknown arg: $1"; exit 1 ;;
  esac
  shift
done

if [ "$(id -u)" -ne 0 ]; then
  echo "run as root (sudo)"; exit 1
fi

export DEBIAN_FRONTEND=noninteractive
echo "[1/7] installing system packages..."
apt-get update -qq
apt-get install -y -qq git python3 python3-venv python3-pip ffmpeg ghostscript curl ca-certificates > /dev/null

echo "[2/7] installing node 20..."
if ! command -v node >/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null
  apt-get install -y -qq nodejs > /dev/null
fi

echo "[3/7] cloning $REPO ($BRANCH)..."
rm -rf "$APP_DIR"
git clone -q --depth 1 --branch "$BRANCH" "$REPO" "$APP_DIR"

echo "[4/7] python environment..."
python3 -m venv "$APP_DIR/website/backend/venv"
"$APP_DIR/website/backend/venv/bin/pip" install -q --upgrade pip
"$APP_DIR/website/backend/venv/bin/pip" install -q -r "$APP_DIR/website/backend/requirements.txt"

echo "[5/7] building frontend..."
cd "$APP_DIR/website"
npm install --no-audit --no-fund -q 2>&1 | tail -1
npm run build 2>&1 | tail -2

echo "[6/7] installing systemd service..."
cat > /etc/systemd/system/alphamedia-api.service <<EOF
[Unit]
Description=AlphaMedia API backend
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR/website/backend
ExecStart=$APP_DIR/website/backend/venv/bin/python -u -m uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable -q alphamedia-api.service
systemctl restart alphamedia-api.service

echo "[7/7] verifying..."
for i in $(seq 1 12); do
  sleep 5
  if curl -sf -o /dev/null http://127.0.0.1:8000/openapi.json; then
    echo "API is up: http://127.0.0.1:8000"
    break
  fi
  [ "$i" = 12 ] && { echo "API failed to start, check: journalctl -u alphamedia-api"; exit 1; }
done

if [ "$WITH_TUNNEL" = 1 ]; then
  echo "installing cloudflared..."
  curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
  chmod +x /usr/local/bin/cloudflared
  cat > /etc/systemd/system/alphamedia-tunnel.service <<EOF
[Unit]
Description=AlphaMedia Cloudflare quick tunnel
After=network-online.target alphamedia-api.service
Requires=alphamedia-api.service

[Service]
Type=simple
Environment=TUNNEL_TRANSPORT_PROTOCOL=http2
ExecStart=/usr/local/bin/cloudflared tunnel --url http://127.0.0.1:8000
Restart=always
RestartSec=10
StandardOutput=append:/var/log/alphamedia-tunnel.log
StandardError=append:/var/log/alphamedia-tunnel.log

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable -q alphamedia-tunnel.service
  systemctl restart alphamedia-tunnel.service
  echo "tunnel starting... public URL will appear in: journalctl -u alphamedia-tunnel -f"
  echo "(look for 'https://<name>.trycloudflare.com')"
fi

echo ""
echo "DONE. API: http://127.0.0.1:8000  |  Frontend served from the same port."
echo "Logs: journalctl -u alphamedia-api -f"
