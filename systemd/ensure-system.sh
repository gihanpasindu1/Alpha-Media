#!/bin/bash
# Ensure system packages the backend needs are present.
# apt-installed files live outside the home dir and are wiped when the
# runtime replaces the VM, so reinstall from the bundled .debs if missing.
# Also refresh the egress proxy CA bundle (it lives on tmpfs).
set -u
export DEBIAN_FRONTEND=noninteractive

if ! command -v gs >/dev/null 2>&1; then
    echo "[ensure-system] ghostscript missing, installing from bundled debs..."
    dpkg -i /home/hatch/workspace/tgbot/systemd/debs/*.deb 2>&1 | tail -2
    if command -v gs >/dev/null 2>&1; then
        echo "[ensure-system] ghostscript OK"
    else
        echo "[ensure-system] WARNING: ghostscript install failed"
    fi
fi

# Refresh the egress CA bundle from the runtime (tmpfs, may rotate).
if [ -f /run/hatch/egress-tls/ca-bundle.pem ]; then
    cp /run/hatch/egress-tls/ca-bundle.pem /home/hatch/workspace/tgbot/systemd/egress-ca-bundle.pem
    chmod 644 /home/hatch/workspace/tgbot/systemd/egress-ca-bundle.pem
fi
