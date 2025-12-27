---
title: Don't be precious and practice lots
date: 2025-12-25T00:00:00
draft: false
slug: stop-noodle
aliases:
tags:
  - tool
image: images/features/noodle-animation_1.gif
description:
---
**Stop Noodling** is a timed drawing webapp

It's designed to use a local Eagle image library and it's tags and run on a local home server. 

 <!--more-->

[Eagle](http://eagle.cool) is a great software for storing and organizing reference images. This tool, uses it's library and metadata to make a timed drawing session. Which is often used for drawing warmups and to focus on the fundamentals rather than rendering. 
#### Features:
1. Setup a draw session 
	- Types of images (Hands, Clothed, Figure, Portrait)
	- Timer (30s, 1 min, 2 min, ect...)
	- Number of images (10, 20, 30)

2.  Run session

3. Review
	- Re-access session images
	- Zoom/Pan

#### Home server setup:

Stop noodling is design to run as a web service. I've set it up on my Rasberry Pi so it's always running and I can access it from any of my devices anywhere. Apples PWA (Add to Home Screen) features let's it become it's own app. 


![Setup Flowchart](/images/features/img_stopnoodle.jpg)

#### Setup Architecture:

- **Source of Truth**: MacBook Eagle Library (~20K images, 50GB)
- **Sync Layer**: Syncthing (bidirectional, always-on) keeps Mac ↔ Pi in sync
- **Server**: Raspberry Pi 5 with 2TB NVMe, runs Python HTTP server as systemd service
- **Access**: Tailscale VPN mesh allows secure access from anywhere
- **Clients**: iPad/iPhone access via PWA (Add to Home Screen)
- **Workflow**: Favorite images on iPad → metadata syncs back to Mac → appears in Eagle


### Links: 

- [Live Demo](https://vghpe.github.io/stop-noodeling/demo/) 
- [Repository](https://github.com/vghpe/stop-noodeling)