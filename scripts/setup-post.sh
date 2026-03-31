#!/usr/bin/env bash
# setup-post.sh
#
# Run from Obsidian via Templater when a post slug is ready.
# Creates static/images/posts/{slug}/, copies temp_hero.png, sets image: frontmatter.
#
# Usage: bash scripts/setup-post.sh /absolute/path/to/post.md

set -euo pipefail

POST_FILE="$1"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Read slug from frontmatter
slug=$(grep -m1 '^slug:' "$POST_FILE" 2>/dev/null | sed 's/slug:[[:space:]]*//' | tr -d '"' | tr -d "'")

if [ -z "$slug" ]; then
  echo "ERROR: No slug set in frontmatter. Add slug: to the post first."
  exit 1
fi

STATIC_DIR="$REPO_ROOT/static/images/posts/$slug"

if [ -d "$STATIC_DIR" ]; then
  echo "Already exists: static/images/posts/$slug/"
  exit 0
fi

mkdir -p "$STATIC_DIR"

PLACEHOLDER="$REPO_ROOT/static/images/site/temp_hero.png"
if [ -f "$PLACEHOLDER" ]; then
  cp "$PLACEHOLDER" "$STATIC_DIR/temp_hero.png"
  sed -i '' 's|^image:.*|image: /images/posts/'"$slug"'/temp_hero.png|' "$POST_FILE"
  echo "Created: static/images/posts/$slug/ — temp_hero.png set as hero"
else
  echo "Created: static/images/posts/$slug/ (temp_hero.png not found, image: left unchanged)"
fi
