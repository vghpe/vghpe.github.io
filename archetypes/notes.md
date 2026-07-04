---
date: {{ .Date }}
publishDate: {{ .Date }}
images:
  - notes/example.jpg
photo:
  - url: notes/example.jpg
    alt: ""
category: []
syndication: []
---

<!--
Notes are normally created by IndieKit (photo posts land here via
plugins/photo-to-notes.js). This archetype mirrors that shape for
hand-authored notes:
  images:      list of image paths under static/notes/
  photo:       list of { url, alt } objects
  category:    list of tags, e.g. [sketch, fineliner]
  syndication: list of cross-post URLs (Bluesky, X)
Remove images/photo for text-only notes.
-->
