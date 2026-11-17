---
title: They Love You
date: 2026-11-15T21:00:00+01:00
draft: true
slug: they-love-you
tags:
  - design
  - playable
image: /images/posts/love-you/header.gif
caption: ""
description: A small top-down game from 2012, back in the browser.
aliases: []
---
They Love You is a small top-down arcade game. It was made by Paul Annesley, Zac Duff and me for TIGJam Australia 2012. This version re-designs several elements and makes it web-friendly (again). 

If you're in front of a keyboard, **GIVE IT A PLAY!**

<!--more-->

<div class="they-love-you" style="width: 100%; aspect-ratio: 1; margin: 1.5em auto;">
  <iframe src="/games/they-love-you/" title="They Love You" scrolling="no" allowfullscreen
          style="width: 100%; height: 100%; border: 0; display: block;"></iframe>
</div>

## Why I revived the old game

I was recently repairing a homemade arcade machine for a cafe in Gothenburg. As I was getting high on the soldering fumes, I pondered if it would be possible to port They Love You to the machine. 

They Love You was originally written in an arcane language called UnityScript. Some years ago, Zac and I made a C# version but never published it, and this was before Unity did WebGL exports. 

 Updating the game to a new Unity version wouldn't be hard. The challenge was going to be in the re-design. The original They Love You used a DIRECTIONAL stick, an ACTION button and a RESET button. However, this arcade machine only had a directional stick. 

## The re-design

The original version gave the player a finite number of freeze-bombs per level. Dropping the freeze-bomb at the right moment was key, or you had to reset. Several levels were pure resource puzzles. 

For the re-design I removed all the puzzle levels, made the bombs an infinite resource and added a bomb-charge that's activated by stopping.

It works pretty well. Finding the right place to stop adds a different strategy element.

<figure style="margin: 1.5em auto;">
  <video src="/videos/love-you/bomb-comparison.mp4" autoplay loop muted playsinline preload="auto"
         width="1296" height="792" style="width: 100%; height: auto; display: block;"></video>
  <figcaption class="image-caption">Same level, same route. Left: the original, where the bomb drops on SPACE. Right: the re-design.</figcaption>
</figure>
The auto reset got more complicated, and for this I had to get AI assistance. My initial idea was to use an 8-directional raycast to test for collisions. But it wasn't reliable; instead, a "physics test drive" gave the best result. 

It kinda works like this:

- Every 0.1 s before drawing the frame, take control of the playercontroller and steer it in 8 direction till it's two player sizes away from its current position.
- As soon as 1 test drive clears. Teleport the player back and draw the frame. 
- If we can't get out, use the best attempt and try to turn out. 
- Still stuck? Start the ==stuck countdown==

Again, this all happens before the frame renders, and it's cheaper than I expected. 

![Pushing South West let the player escape! There is still time to survive!](/images/posts/love-you/escape-example.png)

## Sounds

The original had three sounds: music, bombs and a goal fanfare. 

This version adds a lot more. I took this opportunity to get more familiar with noise and tone generation. Almost all the new additions have been built from those basic blocks. In addition I added more texture to the originals. The song also gets a wavy low-pass filter that opens and closes over 25 s. 



