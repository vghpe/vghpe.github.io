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

# Fingerprint of lockfile + patches: npm ci is needed when either changes,
# since patch-package only applies patches to a fresh install
deps_hash() { ssh "$PI" "cat $DEST/package-lock.json $DEST/patches/* 2>/dev/null | md5sum | cut -d' ' -f1"; }
DEPS_BEFORE=$(deps_hash)

rsync "${FLAGS[@]}" .indiekitrc.js package.json package-lock.json "$PI:$DEST/"
rsync "${FLAGS[@]}" --delete plugins/ "$PI:$DEST/plugins/"
rsync "${FLAGS[@]}" --delete patches/ "$PI:$DEST/patches/"

if $CHECK; then
  echo "── Drift check done (lines starting with <, *deleting, or c mean drift) ──"
  exit 0
fi

if [[ "$DEPS_BEFORE" != "$(deps_hash)" ]]; then
  echo "── Lockfile or patches changed: running npm ci (postinstall applies patches) ──"
  ssh "$PI" "cd $DEST && npm ci"
fi

echo "── Verifying config loads ──"
ssh "$PI" "cd $DEST && node -e \"require('./.indiekitrc.js')\" && echo OK"

echo "── Restarting indiekit (sudo password prompt comes from the pi) ──"
ssh -t "$PI" "sudo systemctl restart indiekit"
sleep 3
ssh "$PI" "systemctl is-active indiekit && systemctl show indiekit -p ExecMainStartTimestamp"
