#!/usr/bin/env bash
# Idempotent installer / watchdog for the AlphaMedia backend services
# (API + api.alphamedia.bond named tunnel + Cloudflare API forwarder).
# Safe to run every few minutes: installs unit files if missing
# (VM replacements wipe /etc/systemd/system but keep ~/workspace),
# reloads systemd if they changed, and (re)starts services that are down.
# Does NOT touch the AlphaRDP bridge services (separate system, hands off).
set -u
SRC_DIR="/home/hatch/workspace/tgbot/systemd"
DST_DIR="/etc/systemd/system"
SERVICES="alphamedia-api.service alphamedia-tunnel.service"
TIMERS="alphamedia-watchdog.timer"
# also copy the watchdog .service (oneshot, run by the timer)
UNITS="alphamedia-watchdog.service"

changed=0
for svc in $SERVICES $UNITS $TIMERS; do
  if ! cmp -s "$SRC_DIR/$svc" "$DST_DIR/$svc" 2>/dev/null; then
    cp "$SRC_DIR/$svc" "$DST_DIR/$svc"
    chmod 644 "$DST_DIR/$svc"
    changed=1
  fi
done
if [ "$changed" = "1" ]; then
  systemctl daemon-reload
fi
for svc in $SERVICES; do
  if ! systemctl is-active --quiet "$svc"; then
    systemctl enable --quiet "$svc" 2>/dev/null || true
    systemctl start "$svc" 2>/dev/null || systemctl restart "$svc" 2>/dev/null || true
  fi
done
for tmr in $TIMERS; do
  if ! systemctl is-active --quiet "$tmr"; then
    systemctl enable --quiet "$tmr" 2>/dev/null || true
    systemctl start "$tmr" 2>/dev/null || true
  fi
done

# report status for the watchdog log
for svc in $SERVICES; do
  echo "$svc: $(systemctl is-active "$svc" 2>/dev/null)"
done
