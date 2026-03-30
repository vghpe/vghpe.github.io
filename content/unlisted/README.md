# Unlisted

Files in this directory are **published but not navigable** — they exist at their URL
but don't appear in the site navigation, archive, homepage, or RSS feeds.

Use this for reference documents, shared links, or content you want accessible
by direct URL only (e.g., game design documents shared with collaborators).

- Frontmatter should have `draft: false` (so Hugo builds the page)
- Templates exclude this section from listings via `where .Section "!=" "unlisted"`
