<%*
const date = tp.date.now("YYYY-MM-DD");
const currentName = tp.file.title;
if (!currentName.match(/^\d{4}-\d{2}-\d{2}-/)) {
  await tp.file.rename(`${date}-${currentName}`);
}
_%>
---
title: ""
date: <% tp.date.now("YYYY-MM-DDTHH:mm:ss") %>
draft: true
slug: ""
tags: []
image: ""
caption: ""
description: ""
aliases: []
---

<!-- 
IMAGE GUIDE
  Recommended: 1200×800px landscape JPEG → save to static/images/posts/{slug}/
  Set image: /images/posts/{slug}/filename.jpg in frontmatter
  Works across home page, blog listing, and post header (object-fit: cover crops to fit)
  Full guide: docs/image-guide.md

SHORTCODES
  Video:  {{< video src="/videos/foo.mp4" type="video/mp4" width="640" height="360" caption="Optional caption" >}}
  Audio:  {{< audio src="/audio/foo.mp3" type="audio/mpeg" caption="Optional caption" >}}
  Iframe: {{< iframe src="/path/to/page" allowfullscreen="true" >}}
-->

