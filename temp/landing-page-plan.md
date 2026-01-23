# Plan: Hugo Landing Page Implementation

Convert Lost Garden-inspired landing page into Hugo, maintaining Mini theme for posts while creating fresh home layout.

## Context
- 3 posts tagged "article": FLCL, Kojima diary, Comparing Dialogue
- Mini theme already heavily customized in `themes/mini/`
- Keep existing single post layouts, nav, and footer from Mini
- New landing page layout in `temp/home-lostgarden-v2.html` ready for conversion

## Steps

### 1. Audit current Mini theme customizations
Check `themes/mini/layouts/` to understand what's been modified (navigation, footer, single post layout, current index.html).

### 2. Convert landing page HTML to Hugo index template
Replace `themes/mini/layouts/index.html` using `home-lostgarden-v2.html` as base:
- Site header: Use `.Site.Title` and `.Site.Params.bio`
- Recent Posts: `{{ range first 3 .Site.RegularPages }}`
- Featured Articles: `{{ range where .Site.RegularPages "Params.tags" "intersect" (slice "article") }}`
- Sketchbook: `{{ range first 5 (where .Site.RegularPages "Section" "eq" "notes") }}`
- All Posts: Use `.Paginator` for chronological list
- Convert dates, images, titles, summaries to Hugo syntax

### 3. Extract CSS to theme stylesheet
Move inline styles to `themes/mini/static/css/`, keeping existing Mini styles and adding new landing page grids.

### 4. Integrate Mini theme components
Include existing `{{ partial "navigation.html" }}` and `{{ partial "footer.html" }}` - verify they match design.

### 5. Handle image paths
Establish `image: images/filename.jpg` in frontmatter, stored in `static/images/`, rendered as `{{ .Params.image }}`.

### 6. Test filtering logic
Verify articles show only "article" tagged posts, recent posts exclude notes/docs, sketchbook shows notes/ with images.

### 7. Build and validate
Run `hugo server`, check landing page renders, images work, single posts unchanged, navigation intact.

### 8. Responsive testing
Test mobile/tablet/desktop breakpoints.

## Image Standards
**16:9 aspect ratio (1920×1080px)** - keep focal points in center 60% safe zone.

## Deferred Items
- Article rotation/randomization
- Navigation/footer refinement to match landing aesthetic
