---
title: Quick Stitch Image Tool
date: 2024-08-28T23:38:26-07:00
draft: false
slug: image-stitch
aliases:
  - /posts/image_stitch/
tags:
  - tool
image: images/stitch.png
---
I’m transcribing and translating a game development journal from the '90s using AI and some automated validity checks. 

Since the journal entries are bound to a physical book, the entries often wrap to the next column or page. So, I needed a quick way to stitch two captures together vertically.<!--more--> I didn’t want to deal with fiddly image processing, so I wrote a command-line tool that takes two images and appends them using ImageMagick.

I then created a shortcut and added it to the taskbar, and voilà—the captures are merged in two seconds.

[Here is the script](/scripts/stich_images.txt)