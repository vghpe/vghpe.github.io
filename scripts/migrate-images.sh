#!/bin/bash
# Image Migration Script
# Reorganizes static/images/ into slug-based subfolders
# and updates all references in content files.
#
# Run from repo root: bash scripts/migrate-images.sh
# Dry run first:      DRY_RUN=1 bash scripts/migrate-images.sh

set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

DRY_RUN="${DRY_RUN:-0}"
LOG_FILE="scripts/migration-log.txt"
> "$LOG_FILE"

log() { echo "$1" | tee -a "$LOG_FILE"; }

move_file() {
  local src="$1" dest="$2"
  if [ "$DRY_RUN" = "1" ]; then
    log "[DRY] $src -> $dest"
  else
    mkdir -p "$(dirname "$dest")"
    mv "$src" "$dest"
    log "[MOVED] $src -> $dest"
  fi
}

log "=== Image Migration $(date) ==="
log "DRY_RUN=$DRY_RUN"
log ""

# ============================================================
# PHASE 1: Create folder structure and move files
# ============================================================

log "--- Phase 1: Moving files ---"

# --- Site assets (favicon is referenced in head.html) ---
for f in avatar.png favicon.ico; do
  [ -f "static/images/$f" ] && move_file "static/images/$f" "static/images/site/$f"
done

# --- Posts: compare-dilalogue (dialogue comparison article) ---
for f in arranger-flow.png arranger-short-title.png arranger-textbox-2.gif short-hike-flow.png shorthike-textbox-2.gif; do
  [ -f "static/images/$f" ] && move_file "static/images/$f" "static/images/posts/compare-dilalogue/$f"
done

# --- Posts: kojima-diary-study ---
for f in static/images/features/img_article_kojima-*.png; do
  [ -f "$f" ] && move_file "$f" "static/images/posts/kojima-diary-study/$(basename "$f")"
done
# Also the XCF source file
[ -f "static/images/features/img_article_kojima-diary.xcf" ] && \
  move_file "static/images/features/img_article_kojima-diary.xcf" "static/images/posts/kojima-diary-study/img_article_kojima-diary.xcf"

# --- Posts: ai-translation ---
for f in fullpage-scan.jpeg cross-compare.png meld.png kojima-drawing.jpg; do
  [ -f "static/images/$f" ] && move_file "static/images/$f" "static/images/posts/ai-translation/$f"
done

# --- Posts: human-translation ---
for f in kojima-drawing-inverted.jpg; do
  [ -f "static/images/$f" ] && move_file "static/images/$f" "static/images/posts/human-translation/$f"
done

# --- Posts: flcl-creative-process ---
for f in static/images/features/flcl-*.jpg static/images/features/flcl-*.gif; do
  [ -f "$f" ] && move_file "$f" "static/images/posts/flcl-creative-process/$(basename "$f")"
done

# --- Posts: stop-noodle ---
for f in static/images/features/img_noodle_hands.jpg static/images/features/img_stopnoodle.jpg static/images/features/noodle-animation_1.gif; do
  [ -f "$f" ] && move_file "$f" "static/images/posts/stop-noodle/$(basename "$f")"
done

# --- Posts: nipps-proto (male-nipple / knob-design) ---
for f in knob-design-3.jpg knob-design-4.jpg knob-design-5.jpg crescendo-bar.png; do
  [ -f "static/images/$f" ] && move_file "static/images/$f" "static/images/posts/nipps-proto/$f"
done

# --- Posts: paper-designs ---
for f in pen_paper_a.jpg pen_paper_b.jpg pen_paper_c.jpg pen_paper_d.jpg pen_paper_title5.webp; do
  [ -f "static/images/$f" ] && move_file "static/images/$f" "static/images/posts/paper-designs/$f"
done

# --- Posts: twitter-dl-guide ---
for f in get_cookies_locally.png twitter_path.png img-eagle.jpg; do
  [ -f "static/images/$f" ] && move_file "static/images/$f" "static/images/posts/twitter-dl-guide/$f"
done

# --- Posts: mgs2-revisit ---
[ -f "static/images/IMG_2703.jpeg" ] && move_file "static/images/IMG_2703.jpeg" "static/images/posts/mgs2-revisit/IMG_2703.jpeg"

# --- Posts: evil-apes ---
[ -f "static/images/IMG_2718.jpeg" ] && move_file "static/images/IMG_2718.jpeg" "static/images/posts/evil-apes/IMG_2718.jpeg"

# --- Posts: first-unity-export-test ---
[ -f "static/images/jumproad-export.gif" ] && move_file "static/images/jumproad-export.gif" "static/images/posts/first-unity-export-test/jumproad-export.gif"

# --- Posts: media-literacy ---
[ -f "static/images/tagging.png" ] && move_file "static/images/tagging.png" "static/images/posts/media-literacy/tagging.png"

# --- Projects: narrative-outline (shared across versions) ---
for f in nine-platfoms-guide.gif nine-platfoms-map.png nine-platfoms-town_1.gif nine-platfoms-town_2.png nine-platforms-temp.jpg nine-platforms-transporter.gif; do
  [ -f "static/images/$f" ] && move_file "static/images/$f" "static/images/projects/narrative-outline/$f"
done

# --- Projects: scriptment ---
for f in scriptment_awake.jpg scriptment_face.jpg scriptment_flattfall.jpg scriptment_flower.jpg scriptment_guide.jpg; do
  [ -f "static/images/$f" ] && move_file "static/images/$f" "static/images/projects/scriptment/$f"
done

# --- Projects: characters ---
[ -f "static/images/IMG_5639.jpg" ] && move_file "static/images/IMG_5639.jpg" "static/images/projects/characters/IMG_5639.jpg"

# --- About page ---
[ -f "static/images/IMG_1647.jpg" ] && move_file "static/images/IMG_1647.jpg" "static/images/posts/about/IMG_1647.jpg"

# --- Old note images -> move to static/notes/ ---
NOTE_IMAGES=(
  IMG_2454.jpeg IMG_2483.jpeg IMG_2609.jpeg IMG_2632.jpeg
  IMG_2642.jpeg IMG_2652.jpeg IMG_2776.jpeg IMG_2824.jpeg
  IMG_2826.jpeg IMG_2831.jpeg IMG_2832.jpeg IMG_2841.jpeg
  IMG_2850.jpeg IMG_2855.jpeg FullSizeRender.jpeg new_icon.png
)
for f in "${NOTE_IMAGES[@]}"; do
  [ -f "static/images/$f" ] && move_file "static/images/$f" "static/notes/$f"
done

# --- Photos -> move to static/notes/ (photos dir shouldn't exist) ---
for f in static/photos/*; do
  [ -f "$f" ] && move_file "$f" "static/notes/$(basename "$f")"
done

# --- Orphaned files -> misc/ ---
ORPHANED=(
  2025_02_18.png arranger-talk.png arranger-textbox.gif blue.png
  GpsrUHBbkAADv8y.jpeg IMG_1577.jpg IMG_2580.jpeg IMG_2582-2.jpeg
  IMG_2582.jpeg IMG_2584.jpeg IMG_2585.jpeg IMG_2587.jpeg
  IMG_2590.jpg IMG_2592.jpeg IMG_2593.jpeg IMG_2602.jpeg
  IMG_2626.jpeg IMG_2639-2.jpeg IMG_2639.jpeg IMG_2710.jpeg
  IMG_2727.jpeg IMG_2777.jpeg knob-design-1.jpg knob-design-2.jpg
  nine-platfoms-town_2.png pink.png purple.png shorthike-textbox.gif
  stitch.png
)
for f in "${ORPHANED[@]}"; do
  [ -f "static/images/$f" ] && move_file "static/images/$f" "static/images/misc/$f"
done

# --- Remove empty features/ directory ---
if [ "$DRY_RUN" != "1" ] && [ -d "static/images/features" ]; then
  rmdir "static/images/features" 2>/dev/null && log "[REMOVED] static/images/features/ (empty)" || log "[KEPT] static/images/features/ (not empty)"
fi

# --- Remove empty photos/ directory ---
if [ "$DRY_RUN" != "1" ] && [ -d "static/photos" ]; then
  rmdir "static/photos" 2>/dev/null && log "[REMOVED] static/photos/ (empty)" || log "[KEPT] static/photos/ (not empty)"
fi

log ""
log "--- Phase 1 complete ---"
log ""

# ============================================================
# PHASE 2: Update references in content files
# ============================================================

log "--- Phase 2: Updating references ---"

# Build sed replacement pairs: old_path -> new_path
# Format: s|old|new|g
REPLACEMENTS=(
  # Site assets
  '/images/favicon.ico|/images/site/favicon.ico'

  # Posts: compare-dilalogue
  '/images/arranger-flow.png|/images/posts/compare-dilalogue/arranger-flow.png'
  '/images/arranger-short-title.png|/images/posts/compare-dilalogue/arranger-short-title.png'
  '/images/arranger-textbox-2.gif|/images/posts/compare-dilalogue/arranger-textbox-2.gif'
  '/images/short-hike-flow.png|/images/posts/compare-dilalogue/short-hike-flow.png'
  '/images/shorthike-textbox-2.gif|/images/posts/compare-dilalogue/shorthike-textbox-2.gif'

  # Posts: kojima-diary-study (features/ -> posts/kojima-diary-study/)
  '/images/features/img_article_kojima-bigshell.png|/images/posts/kojima-diary-study/img_article_kojima-bigshell.png'
  '/images/features/img_article_kojima-juggling.png|/images/posts/kojima-diary-study/img_article_kojima-juggling.png'
  '/images/features/img_article_kojima-bigjuggle.png|/images/posts/kojima-diary-study/img_article_kojima-bigjuggle.png'
  '/images/features/img_article_kojima-sweroom.png|/images/posts/kojima-diary-study/img_article_kojima-sweroom.png'
  '/images/features/img_article_kojima-t2.png|/images/posts/kojima-diary-study/img_article_kojima-t2.png'
  '/images/features/img_article_kojima-luden.png|/images/posts/kojima-diary-study/img_article_kojima-luden.png'
  '/images/features/img_article_kojima-deadcell.png|/images/posts/kojima-diary-study/img_article_kojima-deadcell.png'
  '/images/features/img_article_kojima-diary-closed.png|/images/posts/kojima-diary-study/img_article_kojima-diary-closed.png'
  '/images/features/img_article_kojima-diary-open.png|/images/posts/kojima-diary-study/img_article_kojima-diary-open.png'
  '/images/features/img_article_kojima-diary.png|/images/posts/kojima-diary-study/img_article_kojima-diary.png'

  # Posts: ai-translation
  '/images/fullpage-scan.jpeg|/images/posts/ai-translation/fullpage-scan.jpeg'
  '/images/cross-compare.png|/images/posts/ai-translation/cross-compare.png'
  '/images/meld.png|/images/posts/ai-translation/meld.png'
  '/images/kojima-drawing.jpg|/images/posts/ai-translation/kojima-drawing.jpg'

  # Posts: human-translation
  '/images/kojima-drawing-inverted.jpg|/images/posts/human-translation/kojima-drawing-inverted.jpg'

  # Posts: flcl-creative-process (features/ -> posts/)
  '/images/features/flcl-title.jpg|/images/posts/flcl-creative-process/flcl-title.jpg'
  '/images/features/flcl-evangelion.jpg|/images/posts/flcl-creative-process/flcl-evangelion.jpg'
  '/images/features/flcl-note-a.jpg|/images/posts/flcl-creative-process/flcl-note-a.jpg'
  '/images/features/flcl-note-b.jpg|/images/posts/flcl-creative-process/flcl-note-b.jpg'
  '/images/features/flcl-voice.jpg|/images/posts/flcl-creative-process/flcl-voice.jpg'
  '/images/features/flcl-music.jpg|/images/posts/flcl-creative-process/flcl-music.jpg'
  '/images/features/flcl-styles.gif|/images/posts/flcl-creative-process/flcl-styles.gif'
  '/images/features/flcl-bird.jpg|/images/posts/flcl-creative-process/flcl-bird.jpg'
  '/images/features/flcl-animation.gif|/images/posts/flcl-creative-process/flcl-animation.gif'
  '/images/features/flcl-ohira.jpg|/images/posts/flcl-creative-process/flcl-ohira.jpg'

  # Posts: stop-noodle (features/ -> posts/)
  '/images/features/noodle-animation_1.gif|/images/posts/stop-noodle/noodle-animation_1.gif'
  '/images/features/img_noodle_hands.jpg|/images/posts/stop-noodle/img_noodle_hands.jpg'
  '/images/features/img_stopnoodle.jpg|/images/posts/stop-noodle/img_stopnoodle.jpg'

  # Posts: nipps-proto
  '/images/knob-design-3.jpg|/images/posts/nipps-proto/knob-design-3.jpg'
  '/images/knob-design-4.jpg|/images/posts/nipps-proto/knob-design-4.jpg'
  '/images/knob-design-5.jpg|/images/posts/nipps-proto/knob-design-5.jpg'
  '/images/crescendo-bar.png|/images/posts/nipps-proto/crescendo-bar.png'

  # Posts: paper-designs
  '/images/pen_paper_a.jpg|/images/posts/paper-designs/pen_paper_a.jpg'
  '/images/pen_paper_b.jpg|/images/posts/paper-designs/pen_paper_b.jpg'
  '/images/pen_paper_c.jpg|/images/posts/paper-designs/pen_paper_c.jpg'
  '/images/pen_paper_d.jpg|/images/posts/paper-designs/pen_paper_d.jpg'
  '/images/pen_paper_title5.webp|/images/posts/paper-designs/pen_paper_title5.webp'

  # Posts: twitter-dl-guide
  '/images/get_cookies_locally.png|/images/posts/twitter-dl-guide/get_cookies_locally.png'
  '/images/twitter_path.png|/images/posts/twitter-dl-guide/twitter_path.png'
  '/images/img-eagle.jpg|/images/posts/twitter-dl-guide/img-eagle.jpg'

  # Posts: mgs2-revisit
  '/images/IMG_2703.jpeg|/images/posts/mgs2-revisit/IMG_2703.jpeg'

  # Posts: evil-apes
  '/images/IMG_2718.jpeg|/images/posts/evil-apes/IMG_2718.jpeg'

  # Posts: first-unity-export-test
  '/images/jumproad-export.gif|/images/posts/first-unity-export-test/jumproad-export.gif'

  # Posts: media-literacy
  '/images/tagging.png|/images/posts/media-literacy/tagging.png'

  # Projects: narrative-outline
  '/images/nine-platfoms-guide.gif|/images/projects/narrative-outline/nine-platfoms-guide.gif'
  '/images/nine-platfoms-map.png|/images/projects/narrative-outline/nine-platfoms-map.png'
  '/images/nine-platfoms-town_1.gif|/images/projects/narrative-outline/nine-platfoms-town_1.gif'
  '/images/nine-platfoms-town_2.png|/images/projects/narrative-outline/nine-platfoms-town_2.png'
  '/images/nine-platforms-temp.jpg|/images/projects/narrative-outline/nine-platforms-temp.jpg'
  '/images/nine-platforms-transporter.gif|/images/projects/narrative-outline/nine-platforms-transporter.gif'

  # Projects: scriptment
  '/images/scriptment_awake.jpg|/images/projects/scriptment/scriptment_awake.jpg'
  '/images/scriptment_face.jpg|/images/projects/scriptment/scriptment_face.jpg'
  '/images/scriptment_flattfall.jpg|/images/projects/scriptment/scriptment_flattfall.jpg'
  '/images/scriptment_flower.jpg|/images/projects/scriptment/scriptment_flower.jpg'
  '/images/scriptment_guide.jpg|/images/projects/scriptment/scriptment_guide.jpg'

  # Projects: characters
  '/images/IMG_5639.jpg|/images/projects/characters/IMG_5639.jpg'

  # About
  '/images/IMG_1647.jpg|/images/posts/about/IMG_1647.jpg'

  # Old note images -> notes/ (frontmatter uses no leading slash)
  'images/IMG_2454.jpeg|notes/IMG_2454.jpeg'
  'images/IMG_2483.jpeg|notes/IMG_2483.jpeg'
  'images/IMG_2609.jpeg|notes/IMG_2609.jpeg'
  'images/IMG_2632.jpeg|notes/IMG_2632.jpeg'
  'images/IMG_2642.jpeg|notes/IMG_2642.jpeg'
  'images/IMG_2652.jpeg|notes/IMG_2652.jpeg'
  'images/IMG_2776.jpeg|notes/IMG_2776.jpeg'
  'images/IMG_2824.jpeg|notes/IMG_2824.jpeg'
  'images/IMG_2826.jpeg|notes/IMG_2826.jpeg'
  'images/IMG_2831.jpeg|notes/IMG_2831.jpeg'
  'images/IMG_2832.jpeg|notes/IMG_2832.jpeg'
  'images/IMG_2841.jpeg|notes/IMG_2841.jpeg'
  'images/IMG_2850.jpeg|notes/IMG_2850.jpeg'
  'images/IMG_2855.jpeg|notes/IMG_2855.jpeg'
  'images/FullSizeRender.jpeg|notes/FullSizeRender.jpeg'
  'images/new_icon.png|notes/new_icon.png'
)

# Apply replacements to content files
# We need to handle both frontmatter (no leading /) and inline markdown (leading /)
find content/ -name "*.md" -not -path "*/\.obsidian/*" | while read -r file; do
  changed=0

  # Standardize: frontmatter `image: images/...` -> `image: /images/...` (add leading slash)
  # But NOT for notes/ paths which stay relative
  if grep -q '^image: images/' "$file" 2>/dev/null; then
    if [ "$DRY_RUN" = "1" ]; then
      log "[DRY] Standardize frontmatter slash in $file"
    else
      sed -i '' 's|^image: images/|image: /images/|' "$file"
      changed=1
    fi
  fi
  # Also handle quoted: image: "images/..."
  if grep -q '^image: "images/' "$file" 2>/dev/null; then
    if [ "$DRY_RUN" = "1" ]; then
      log "[DRY] Standardize quoted frontmatter slash in $file"
    else
      sed -i '' 's|^image: "images/|image: "/images/|' "$file"
      changed=1
    fi
  fi

  [ "$changed" = "1" ] && log "[STANDARDIZED] $file"
done

# Now apply path replacements
for pair in "${REPLACEMENTS[@]}"; do
  old="${pair%%|*}"
  new="${pair##*|}"

  # Find files containing the old path
  files=$(grep -rl "$old" content/ --include="*.md" 2>/dev/null | grep -v '.obsidian' || true)
  if [ -n "$files" ]; then
    for file in $files; do
      if [ "$DRY_RUN" = "1" ]; then
        log "[DRY] In $file: $old -> $new"
      else
        sed -i '' "s|$old|$new|g" "$file"
        log "[UPDATED] $file: $old -> $new"
      fi
    done
  fi
done

# Special case: Point Dune has "/images/..." with quotes and leading slash already
# The quoted standardization step would turn "/images/ into "//images/ - fix that
for file in $(grep -rl '"//images/' content/ --include='*.md' 2>/dev/null || true); do
  if [ "$DRY_RUN" = "1" ]; then
    log "[DRY] Fix double-slash in $file"
  else
    sed -i '' 's|"//images/|"/images/|g' "$file"
    log "[FIXED] double-slash in $file"
  fi
done

# Fix note image frontmatter: these should use notes/ prefix (no /images/)
# After all migrations, old note images now live in static/notes/
# Frontmatter for notes needs: image: notes/FILENAME (Hugo resolves via absURL)
# The note replacements above handle the path, but we need to make sure
# the standardization step didn't break them by adding /images/ prefix

log ""
log "--- Phase 2 complete ---"
log ""

# Also update layouts reference to favicon
FAVICON_TEMPLATE="layouts/partials/head.html"
if [ -f "$FAVICON_TEMPLATE" ]; then
  if grep -q '"/images/favicon.ico"' "$FAVICON_TEMPLATE" 2>/dev/null; then
    if [ "$DRY_RUN" = "1" ]; then
      log "[DRY] Update favicon path in $FAVICON_TEMPLATE"
    else
      sed -i '' 's|"/images/favicon.ico"|"/images/site/favicon.ico"|' "$FAVICON_TEMPLATE"
      log "[UPDATED] $FAVICON_TEMPLATE: favicon path"
    fi
  fi
fi

# ============================================================
# PHASE 3: Verification
# ============================================================

log "--- Phase 3: Verification ---"

# Check for any remaining references to old flat paths
STALE=$(grep -rn '/images/[a-zA-Z0-9_-]*\.\(jpg\|jpeg\|png\|gif\|webp\)' content/ --include="*.md" 2>/dev/null | grep -v '.obsidian' | grep -v '_templates/' | grep -v 'code block' | grep -v '```' || true)
if [ -n "$STALE" ]; then
  log ""
  log "WARNING: Possible stale flat image references:"
  echo "$STALE" | while read -r line; do log "  $line"; done
else
  log "No stale flat image references found."
fi

# Check features/ is gone
if [ -d "static/images/features" ]; then
  remaining=$(ls -1 static/images/features/ 2>/dev/null | wc -l | tr -d ' ')
  log "WARNING: features/ still has $remaining files"
else
  log "features/ directory removed successfully"
fi

log ""
log "=== Migration complete ==="
log "Review $LOG_FILE for full details"
