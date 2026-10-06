#!/bin/bash
# Forwards the sinkholed Cloudflare API IP to the real API through the egress proxy.
# cloudflared ignores proxy env vars and hits the DNS sinkhole directly;
# this makes the sinkhole IP actually work.
set -u
ENV_FILE="/home/hatch/.config/alphamedia-api/env"
PROXY=$(grep -m1 '^https_proxy=' "$ENV_FILE" | cut -d= -f2-)
PHOST=$(echo "$PROXY" | sed -E 's#https?://([^@]+@)?([^:/]+).*#\2#')
PAUTH=$(echo "$PROXY" | sed -E 's#https?://([^@]+)@.*#\1#')
# The DNS sinkhole IP for api.trycloudflare.com can rotate (it changed after a
# VM replacement), so resolve it fresh each start and add a local route for it;
# without the route socat cannot bind a non-local sinkhole address.
SINK=$(getent hosts api.trycloudflare.com | awk '{print $1}' | head -1)
[ -n "$SINK" ] || SINK=198.18.230.156
ip route replace local "$SINK/32" dev lo 2>/dev/null
exec socat TCP-LISTEN:443,bind="$SINK",fork,reuseaddr \
    "PROXY:${PHOST}:api.trycloudflare.com:443,proxyport=3128,proxyauth=${PAUTH}"
