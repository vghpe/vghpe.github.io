---
title: They Love You
date: 2026-11-15T21:00:00+01:00
draft: true
slug: they-love-you
tags:
  - design
  - playable
image: ""
caption: ""
description: A small top-down game from 2012, back in the browser.
aliases: []
---
They Love You is a small top-down game. It was made by Paul Annesley and Zac Duff and myself for TigJam Australia 2012. This version re-design several elements and make is web  friendly (again). 

If you're on front of a keyboard **GIVE IT A PLAY!**

<!--more-->

<div class="they-love-you" style="width: 100%; aspect-ratio: 1; margin: 1.5em auto;">
  <iframe src="/games/they-love-you/" title="They Love You" scrolling="no" allowfullscreen
          style="width: 100%; height: 100%; border: 0; display: block;"></iframe>
</div>

### Why I revived the old game

I was recently repairing a home-made arcade machine for a cafe in Gothenburg. As I was getting high of the soldering fumes I was wondering if it would be possible to port They Love You to the machine. 

The game was original written in an arcane language called UnityScript. Zac and I did some years ago make a C# version but never published it and this was before unity did webgl exports. 

But updating the game to a new unity version wouldn't be hard. The challenge was going to be in the redesign. The original The Love You used Directional stick + Action Button + Reset Button. However this arcade machine only had a directional stick. 

### The re-design

The original version gave the player a finite number of freeze-bombs per level. Dropping the freeze-bomb at the right moment was key or you had to reset. Several level were pure resource puzzles. 

For the redesign 
- Removed all the puzzle levels 
- Bombs an infinite resource.  
- Player have to stop, let it charge, then move to drop a bomb

It works pretty well. Finding the right place to stop makes add a different strategy element, and the puzzle levels, honestly, were never that good.  

<figure style="margin: 1.5em auto;">
  <video src="/videos/love-you/bomb-comparison.mp4" autoplay loop muted playsinline preload="auto"
         width="1296" height="792" style="width: 100%; height: auto; display: block;"></video>
  <figcaption class="image-caption">Same level, same route. Left: the original, the bomb drops on SPACE. Right: the re-design, stand still to charge and the bomb goes off when you move on.</figcaption>
</figure>

The auto reset got more complicated and for this, i had to get AI assist, my initial idea was to use a 8 directional raycast to test against collision. But it didn't it wasn't reliable instead a "physics test drive" gave the best result. 

It works like this: Every 0.1 s (in FixedUpdate), checks whether the player can get two player sizes away from it's current position.

- Freeze Monster physics. 
- Take direct control of the PlayerController.
- Try up to 8 directions, one physics step at a time using Player movement parameters
- As soon as test passes, the check stops:. Player is teleported back.
- If none does, it tries one turn from the best attempts. If that fails too, the stuck countdown starts (or keeps running.)

This all happens before the frame renders, and it's cheaper than I expected. 

![Pushing South East let the player escape! There is still time to survive!](/images/posts/love-you/escape-example.png)

### Sounds

The original had 3 sounds, Music, Bombs, Goal fanfare. 

This version adds a lot more. I took this opportunity to get a more familiar with noise and tone generation. Almost all all the new additions has been build from those basics blocks. In addition I added more texture to the originals. The song also get's a wavy lowpass that opens and closes over 25s. 



