---
title: Starfield - Recreating Gunbuster space Backgrounds
date: 2026-04-17T15:53:18+02:00
draft: false
slug: gunbuster
tags:
  - tool
image: /images/posts/gunbuster/looking2-hero.jpg
caption: ""
description: Toy to replicate space backgrounds from Gunbuster
aliases: []
---

I've [written before](https://vghpe.github.io/posts/flcl-creative-process/) about my admiration for the animation studio Gainax and their highly creative work. This time I'm curious about a very particular element: The starfield background art of 1988–1989 OVA *Gunbuster.* 
<!--more-->
The original backgrounds were probably painted with *Nicker Poster Color*, an opaque watercolor similar to gouache. The stars were likely dotted-on with a brush (or sprayed-on in case of nebula). 

![Mostly the stars scroll with the background, but a few times they parallax. My guess is a transparent sheet was used.](/images/posts/gunbuster/gunbuster.jpg)

The interesting artistic choice is how colorful they made it. It's psychedelic, using intentionally imperfect sphere, and close too breaking the illusion of a night sky.   

--- 

When recreating this this art digitally, the challenge isn’t covering a canvas with blobby particles. It's in re-creating the artifacts from the analog pipeline (Lenses, Cameras, Film) that gives it a soft and organic look. 

Zooming into a high-resolution capture and compressing the tonal range reveals some of these optical characteristics. Blues tend to shift right, reds bleed outward. There’s also a noticeable amount of film grain and haloing.

![Even with digital artifacts, we can deduce a lot about the analogue pipeline.](/images/posts/gunbuster/buster-levels.png)

Using blurs, chromatic aberration, a fake noise grain, some film filters we can get pretty close. 

Three.js was used for rendering, lil-gui for the control panel and Claude helped me write the WebGL shaders. When everything was set up it was a matter of dialing in the value to match up with the references. 

- [Open the starfield toy](/tools/starfield/)
- [Check out the repo](https://github.com/vghpe/gunbuster-stars)
