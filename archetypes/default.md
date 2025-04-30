+++
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
date = {{ .Date }}
draft = true
++

# Media Embedding Shortcodes Examples
<!--
Embed a video:
{{< video src="/videos/foo.mp4" type="video/mp4" width="640" height="360" caption="Optional caption" >}}

Embed an audio clip:
{{< audio src="/audio/foo.mp3" type="audio/mpeg" caption="Optional caption" >}}

Embed an iframe:
{{< iframe src="/path/to/page" allowfullscreen="true" >}}
-->
