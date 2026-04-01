#!/usr/bin/env bash
# bump-document-version.sh
#
# Run from Obsidian via Templater to create the next version of a project document.
# Copies the current file, increments the minor version (e.g. v1.1 → v1.2),
# stamps today's date, and derives a new slug.
#
# Usage: bash scripts/bump-document-version.sh /absolute/path/to/current-version.md

set -euo pipefail

SOURCE_FILE="$1"
DIR="$(dirname "$SOURCE_FILE")"

# --- Read frontmatter fields ---

revision=$(grep -m1 '^revision:' "$SOURCE_FILE" | sed 's/revision:[[:space:]]*//' | tr -d '"' | tr -d "'")
document=$(grep -m1 '^document:' "$SOURCE_FILE" | sed 's/document:[[:space:]]*//' | tr -d '"' | tr -d "'")
slug=$(grep -m1 '^slug:' "$SOURCE_FILE" | sed 's/slug:[[:space:]]*//' | tr -d '"' | tr -d "'")

if [ -z "$revision" ]; then
  echo "ERROR: No 'revision' field found in frontmatter."
  exit 1
fi

if [ -z "$document" ]; then
  echo "ERROR: No 'document' field found in frontmatter."
  exit 1
fi

if [ -z "$slug" ]; then
  echo "ERROR: No 'slug' field found in frontmatter."
  exit 1
fi

# --- Parse revision: vX.Y ---

if [[ ! "$revision" =~ ^v([0-9]+)\.([0-9]+)$ ]]; then
  echo "ERROR: Revision '$revision' does not match expected format vX.Y (e.g. v1.1)."
  exit 1
fi

major="${BASH_REMATCH[1]}"
minor="${BASH_REMATCH[2]}"
new_minor=$((minor + 1))
new_revision="v${major}.${new_minor}"

# --- Derive new slug ---
# Strip trailing version suffix e.g. -v1-1 or -v1 from existing slug

base_slug=$(echo "$slug" | sed 's/-v[0-9][0-9]*\(-[0-9][0-9]*\)*$//')
version_suffix="v${major}-${new_minor}"
new_slug="${base_slug}-${version_suffix}"

# --- Derive new filename ---

new_filename="${document}-v${major}.${new_minor}.md"
new_file="$DIR/$new_filename"

if [ -f "$new_file" ]; then
  echo "ERROR: $new_filename already exists."
  exit 1
fi

# --- Copy and update frontmatter ---

today=$(date +"%Y-%m-%dT%H:%M:%S%z")

cp "$SOURCE_FILE" "$new_file"

# Update revision
sed -i '' "s|^revision:.*|revision: \"${new_revision}\"|" "$new_file"

# Update date
sed -i '' "s|^date:.*|date: ${today}|" "$new_file"

# Update slug
sed -i '' "s|^slug:.*|slug: \"${new_slug}\"|" "$new_file"

echo "Created $new_filename"
echo "  revision: $new_revision"
echo "  slug: $new_slug"
echo "  date: $today"
