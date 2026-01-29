#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/serve-local.sh [port] [iface]
# Defaults: port=1313 iface=en0

PORT=${1:-1313}
IFACE=${2:-en0}

IP=$(ipconfig getifaddr "$IFACE" 2>/dev/null || true)
if [ -z "$IP" ]; then
  echo "Could not determine IP for interface $IFACE" >&2
  echo "Try: ipconfig getifaddr en0" >&2
  exit 1
fi

BASEURL="http://${IP}:${PORT}"

echo "Starting Hugo server on ${BASEURL} (binding 0.0.0.0, port ${PORT})"

hugo server --bind 0.0.0.0 --baseURL "$BASEURL" --port "$PORT"
