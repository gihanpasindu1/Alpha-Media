#!/usr/bin/env bash
# Runs at boot: fully restores AlphaMedia after VM replacement.
# Called by alphamedia-boot-recovery.service (WantedBy=multi-user.target)
set -u
SRC="/home/hatch/workspace/tgbot/systemd"
LOG="/home/hatch/workspace/tgbot/systemd/boot-recovery.log"
exec >>"$LOG" 2>&1
echo "=== Boot recovery started at $(date) ==="

# 1. Reinstall unit files (VM wipes /etc/systemd/system)
for unit in alphamedia-api.service alphamedia-tunnel.service alphamedia-watchdog.service alphamedia-watchdog.timer; do
  if [ -f "$SRC/$unit" ]; then
    cp "$SRC/$unit" /etc/systemd/system/$unit
    chmod 644 /etc/systemd/system/$unit
  fi
done
systemctl daemon-reload

# 2. System deps (ghostscript)
bash "$SRC/ensure-system.sh" || echo "ensure-system failed"

# 3. Python venv
bash "$SRC/ensure-venv.sh" || echo "ensure-venv failed"

# 4. Start services in order
systemctl enable --quiet alphamedia-api.service alphamedia-tunnel.service 2>/dev/null || true
systemctl start alphamedia-api.service || echo "api start failed"
sleep 5
systemctl start alphamedia-tunnel.service || echo "tunnel start failed"

# 5. Enable watchdog timer
systemctl enable --quiet alphamedia-watchdog.timer 2>/dev/null || true
systemctl start alphamedia-watchdog.timer || echo "watchdog timer failed"

# 6. Verify
sleep 10
if curl -s --max-time 10 http://127.0.0.1:8000/openapi.json -o /dev/null; then
  echo "API OK"
else
  echo "API FAILED - check logs"
fi
echo "=== Boot recovery done at $(date) ==="
