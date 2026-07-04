---
date: {{ .Date }}
publishDate: {{ .Date }}
images:
  - images/sketchbook/example.jpg
photo:
  - url: images/sketchbook/example.jpg
    alt: ""
category: []
syndication: []
---

<!--
Sketchbook posts are normally created by IndieKit (note and photo posts land
here via plugins/post-to-sketchbook.js). This archetype mirrors that shape for
hand-authored posts:
  images:      list of image paths under static/images/sketchbook/
  photo:       list of { url, alt } objects
  category:    list of tags, e.g. [sketch, fineliner]
  syndication: list of cross-post URLs (Bluesky, X)
Remove images/photo for text-only posts.
Add title + slug to give the post its own page at /sketchbook/<slug>/;
without them it appears only in the sketchbook grid.
-->
