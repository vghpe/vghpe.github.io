---
title: Learning text rendering at 39
date: 2026-02-14T00:00:00
draft: true
slug: text-animations
aliases:
tags:
  - research
image: images/features/noodle-animation_1.gif
description: Looking at various text rendering techniques and what their good at
---

I've always really liked acting texts. Giving text and letter personality to convey mood, or help prioritize information. 

There are many ways to render text unto a screen and new techniques has developed over the years. There's a very deep here rabbit hole into subpixels, tesselation, memory footprint and cpu/gpu stack. 

There is also no hard truth about what you can or can't do with the various techniques, it's more that softwares and platforms are often written with a preference in mind. So here are the pros and cons that I learned in the ~2 weeks of explore 5 variants of text variants and trying to give them personality 

1. DOM Text + CSS Animation
2. Bezier Manipulation
3. Triangulated glyph with vertex animation
4. Triangulated glyph with bone animation
5. Sprite Atlas with Quad Manipulation
6. (M)SDF

==Disclaimer: AI assistance was used in coding for these demos, in particular, fragment and vertex shader. All designs, assets, animations, research, writing and everything else in the presentation is my own.==

### CSS Animation

Let's start here on the web because that's where we are now. Despite being the most common way we see text on our screen. HTML/CSS text rendering has the most complex rendering pipeline. 

<details><summary>Typical Pipeline</summary>
- HTML parse (text nodes exist in the DOM)
- CSS parse + cascade (computed styles for each text run)
- Font selection (match font-family, choose fallback if needed)
- Font load (download @font-face fonts if required)
- Text shaping (glyph substitution + positioning: ligatures, kerning, complex scripts)
- Line breaking (wrap decisions, break opportunities, hyphenation if enabled)
- Inline layout (glyph runs placed into line boxes, baselines, alignment)
- Layout / reflow (block + inline formatting, sizes and positions finalized)
- Paint setup (build display list: backgrounds, selection, decorations)
- Glyph rasterization (glyphs → bitmap masks, hinting/subpixel rules)
- Glyph caching / atlas upload (store glyph bitmaps and upload to GPU if used)
- Quad generation + batching (glyph runs become textured rectangles + draw calls)
- Compositing (layers combined with transforms, opacity, clipping)
- Present (final frame submitted to the screen)
</details>

This gives us something that's highly flexible (fonts, languages), sharp (subpixel handling), and fancy (spacing, kerning). And despite the big pipeline it's what our browser has been optimised for, but that does relies on the text being static. 

Animation is limited to basic tranformation (Translate, Rotate, Scale, Scew). But we can still do some some cool stuff. 

Unique benefits for animation: 
- No canvas needed
- You can select the text


### Bezier Curve Animation

"But what if I want to be more expressive with the letters!! 🎭💅🎨 Animate bazier curves directly. Feels like this was easy breezy back when we had Flash. What happened?"

Neither web or popular game engines are well optimized to do this at runtime. We can still do it. Either as a Canvas or SVG animation and it works fine for a few characters.

But it scales poorly. With larger or more letters, a lot of heavy work is added to the CPU.  

<details><summary>Typical Pipeline</summary>
1. Load font file (.ttf/.otf)
2. Parse font tables (unitsPerEm, glyphs, kerning, cmap, etc.)
3. Map text → glyph IDs (character lookup in the font)
4. Compute glyph advances (x positions from advanceWidth + kerning)
5. Build glyph outlines (glyph → path commands: M/L/Q/C/Z)
6. Convert outlines to Canvas path calls (moveTo/lineTo/bezierCurveTo)
7. Rasterize filled paths (turn curves into pixels: scan conversion)
8. Blend into canvas (alpha compositing onto the canvas buffer)
9. Present (canvas buffer composited to the screen)
</details>

It's a bit sad, we can make some really cool effects here that would be really hard to re-create with any other method.  


#### Mesh Text Animations

Ok ok. But let's talk about games! What if I want maximum "main character energy" on the letter? Give them a full story arc? 


#### Textured Quads Manipulation

Since the dawn of time, games commonly stored letters in an tile or sprite atlas. Which has a registry of what's where, then it's mapped to a string. Here is a **very** generalized  timeline:

- **Late 70s–early 80s (arcade/home computers)**: Text is rendered as character ROM or bitmap fonts; 
- **80s–early 90s (NES/SNES/Genesis)**: Text is rendered as tiles; could be animated via tile swaps + palette cycling; 
- **Early–mid 90s** (DOS/PC + arcade/some consoles): text is rendered as tiles/sprites or bitmap blits to a framebuffer; some high-end arcade hardware supports per-sprite scaling/rotation,
- **Late 90s (PS1/N64/PC 3D)**: Text is rendered as textured quads (one quad per character); per-letter translate/rotate/scale + basic UV scrolling now standard
- **Early 2000s (DX8/9)**: Text is rendered as textured quads; further programmable with shaders enabling UV distortion + procedural vertex/pixel effects


#### (M)SDF

MSDF is a common rendered in modern game engines. Here's an abstract snipped from a paper published by value in 2007 simply titled **Improved Alpha-Tested Magnification for Vector Textures and Special Effects**

> A simple and efficient method is presented which allows improved rendering of glyphs composed of curved and linear elements. A distance field is generated from a high resolution image, and then stored into a channel of a lower-resolution texture.




