---
title: Testing Unity Web Project Export
date: 2025-01-22T15:30:00-07:00
image: images/jumproad-export.gif
tags:
  - design 
  - playable
slug: first-unity-export-test
aliases:
  - /posts/first_unity_export_test/
---

Unity has hyped up their web export for version 6. How good is it? Can I make a 1 button game that's playable on phone browser? <!--more-->


<div style="display:flex; justify-content:center; margin-bottom:20px; overflow:hidden;">
  <iframe
    src="/unity-project/index.html"
    width="270"
    height="480"
    frameborder="0"
    scrolling="no"
    allowfullscreen>
  </iframe>
</div>


GitHub page hosting seem to have limited support for `Content-Encoding`, So I can't use the best compression models (6MB on Brotli) but Gzip seems to work, making the build a 12MB load on the network. 

That's still a more than I would prefer but I think that's just a result of using Unity. 

But I am imporess with input, seems to work flawlessly even in Safari which is known to fight with web games a lot. 