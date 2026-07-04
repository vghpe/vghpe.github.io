---
title: "Unlisted"
# Section is fully hidden: no /unlisted/ list page, no section RSS feed.
_build:
  render: never
  list: never
# Children render at their URLs but are excluded from every page collection
# (home RSS, sitemap, list templates).
cascade:
  _build:
    render: always
    list: never
---

Files in this directory are **published but not navigable** — they exist at their URL
but don't appear in the site navigation, archive, homepage, sitemap, or RSS feeds.

Use this for reference documents, shared links, or content you want accessible
by direct URL only (e.g., game design documents shared with collaborators).

- Frontmatter should have `draft: false` (so Hugo builds the page)
- Exclusion is enforced by the `_build` options in this file's frontmatter
