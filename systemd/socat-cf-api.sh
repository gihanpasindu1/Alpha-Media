#!/bin/bash
# Forwards the sinkholed Cloudflare API IP to the real API through the egress proxy.
# cloudflared ignores proxy env vars and hits the DNS sinkhole directly;
# this makes the sinkhole IP actually work.
set -u
ENV_FILE="/home/hatch/.config/alphamedia-api/env"
PROXY=$(grep -m1 '^https_proxy=' "$ENV_FILE" | cut -d= -f2-)
PHOST=$(echo "$PROXY" | sed -E 's#https?://([^@]+@)?([^:/]+).*#\2#')
PAUTH=$(echo "$PROXY" | sed -E 's#https?://([^@]+)@.*#\1#')
exec socat TCP-LISTEN:443,bind=198.18.230.156,fork,reuseaddr \
    "PROXY:${PHOST}:api.trycloudflare.com:443,proxyport=3128,proxyauth=${PAUTH}"
