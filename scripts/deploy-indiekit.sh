#!/usr/bin/env bash
# deploy-indiekit.sh
#
# This repo is the source of truth for the IndieKit deployment on Berry
# (/srv/indiekit). Syncs config, plugins, patches, and package files to the
# pi, reinstalls dependencies if the lockfile changed, and restarts the
# service. Secrets (.env) live only on the pi and are never touched.
#
# Usage:
#   scripts/deploy-indiekit.sh          # deploy + restart
#   scripts/deploy-indiekit.sh --check  # show drift, change nothing
#
# The target host is an alias from ~/.ssh/config (keeps user/IP out of this
# public repo). Default is "berry" (LAN); when away from home use the
# Tailscale alias:  PI_HOST=berry_remote scripts/deploy-indiekit.sh
set -euo pipefail

PI="${PI_HOST:-berry}"
DEST="/srv/indiekit"

cd "$(dirname "$0")/.."

FLAGS=(-aivc)
CHECK=false
if [[ "${1:-}" == "--check" ]]; then
  CHECK=true
  FLAGS+=(--dry-run)
  echo "── Drift check (dry run, no changes) ──"
fi

LOCK_BEFORE=$(ssh "$PI" "md5sum $DEST/package-lock.json | cut -d' ' -f1")

rsync "${FLAGS[@]}" .indiekitrc.js package.json package-lock.json "$PI:$DEST/"
rsync "${FLAGS[@]}" --delete plugins/ "$PI:$DEST/plugins/"
rsync "${FLAGS[@]}" --delete patches/ "$PI:$DEST/patches/"

if $CHECK; then
  echo "── Drift check done (lines starting with <, *deleting, or c mean drift) ──"
  exit 0
fi

LOCK_AFTER=$(ssh "$PI" "md5sum $DEST/package-lock.json | cut -d' ' -f1")
if [[ "$LOCK_BEFORE" != "$LOCK_AFTER" ]]; then
  echo "── Lockfile changed: running npm ci (postinstall applies patches) ──"
  ssh "$PI" "cd $DEST && npm ci"
fi

echo "── Verifying config loads ──"
ssh "$PI" "cd $DEST && node -e \"require('./.indiekitrc.js')\" && echo OK"

echo "── Restarting indiekit (sudo password prompt comes from the pi) ──"
ssh -t "$PI" "sudo systemctl restart indiekit"
sleep 3
ssh "$PI" "systemctl is-active indiekit && systemctl show indiekit -p ExecMainStartTimestamp"
