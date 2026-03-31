#!/usr/bin/env bash
# fix-post-images.sh
#
# Run from Obsidian via Templater after dragging images into a post.
# Finds all ![[image.ext]] wikilinks in the post body, moves the files from
# content/ to static/images/posts/{slug}/, and rewrites the links to Hugo paths.
#
# Usage: bash scripts/fix-post-images.sh /absolute/path/to/post.md

set -euo pipefail

POST_FILE="$1"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTENT_ROOT="$REPO_ROOT/content"

# Read slug from frontmatter
slug=$(grep -m1 '^slug:' "$POST_FILE" 2>/dev/null | sed 's/slug:[[:space:]]*//' | tr -d '"' | tr -d "'")

if [ -z "$slug" ]; then
  echo "ERROR: No slug set. Run Setup Post first."
  exit 1
fi

STATIC_DIR="$REPO_ROOT/static/images/posts/$slug"

if [ ! -d "$STATIC_DIR" ]; then
  echo "ERROR: static/images/posts/$slug/ does not exist. Run Setup Post first."
  exit 1
fi

moved=0

# Extract image names from ![[filename.ext]] wikilinks
while IFS= read -r image_name; do
  [ -z "$image_name" ] && continue

  src="$CONTENT_ROOT/$image_name"
  dest="$STATIC_DIR/$image_name"

  if [ ! -f "$src" ]; then
    echo "Skipping (not in content/): $image_name"
    continue
  fi

  mv "$src" "$dest"

  hugo_path="/images/posts/$slug/$image_name"
  python3 -c "
import sys
path = sys.argv[1]
src = sys.argv[2]
dst = sys.argv[3]
content = open(path).read()
open(path, 'w').write(content.replace('![[' + src + ']]', '![](' + dst + ')'))
" "$POST_FILE" "$image_name" "$hugo_path"

  moved=$((moved + 1))
  echo "Moved: $image_name"
done < <(grep -oE '!\[\[[^]]+\.(jpg|jpeg|png|gif|webp|avif)\]\]' "$POST_FILE" | sed 's/^!\[\[//;s/\]\]$//')

if [ "$moved" -eq 0 ]; then
  echo "No new images to move."
else
  echo "Done: moved $moved image(s) to static/images/posts/$slug/"
fi
