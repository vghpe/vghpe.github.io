---
title: Translate, transcribe and image processing
date: 2024-08-28T23:38:26-07:00
draft: false
tags: ["research", "game-dev", "AI"]
image: "images/IMG_2710.jpeg"
---



I’m transcribing and translating a game dev journal from the 90s using AI and some automated validity checks. 

In this spreadsheet. The captured image from the journal is laid next to the transcript to easy cross compare.

Since the journal entries are bound to the physical book the entires will often wrap to the next column or page. So I needed a quick way to stitch 2 captures together vertically. 

I didn’t want deal with an image process so I wrote a command line tool that takes 2 images and appends them using ImageMagic. 

I then made a short cut and added that to the task bar and voilà. The captures are merged in 2 seconds. 

Here is the script