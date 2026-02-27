---
title: Learning text rendering at 39
date: 2026-02-14T00:00:00
draft: true
slug: text-animations
aliases:
tags:
  - research
image: images/features/noodle-animation_1.gif
description: Acting Text
---

I've always really liked acting texts. Giving text and letter personality to convey mood, or help prioritize information. 

Something could be glamorous or really really scary. 

Here are some text rendering techniques unique ways we can animate them. 

1. DOM text with CSS animation
2. Vector glyph outline manipulation using Bézier deformation
3. Triangulated glyph meshes with vertex animation
4. Font sprite atlas using quad, UV, and shader manipulation

### DOM + CSS Animation

Despite being the most common way we see text on our screen the HTML/CSS text rendering pipeline is very complex to allow for maximum flexibility and sharpness. It's really ment to be static but css let's us do basic transformation (Translate, Rotate, Scale, Skew).



(A velocity is calculated from scrolling speed and applied to the the scaling. )

### Vector glyph outline manipulation using Bézier deformation

A font file, contains among other things Vector outlines, which mathematically defines the shapes of letters. We can manipulate these to create "motion graphics" which be hard to any other way. 

This is CPU intensive, and why you typically don't see this a lot in games unless it's pre-rendered. 


### Font Sprite Atlas with Quad/UV/Shader Manipulation

This is how 90% of all texts in games are rendered. First as tiles in the 80s, then as bitmaps in the 90s and today more commonly using SDF (signed distance function) for even better performance and sharpness.  



This is a very efficient way to render text UI, subtities, HUD elements. The downside is we don't get fancy ligatures, kerning, bidirectional text ect for free. So if we want to have arabic or thai ect, extra work and systems are needed. 

### Triangulated glyph with vertex/bone animation

But what if you want your text in your game to have to more "main character energy". 