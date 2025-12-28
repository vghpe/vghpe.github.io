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

Designed to use a local Eagle image library and serve it so it’s accessible from all your devices.

 <!--more-->

The app scans the Eagle library and its metadata to generate timed drawing sessions. Session types are filtered using Eagle tags, and users can star images during a session to apply a favorite tag that’s written back to the library.

![An Eagle library tagged with hands - Photos by Satine Zillah](/images/features/img_noodle_hands.jpg)

#### Features:
1. Setup a draw session 
	- Types of images (Hands, Clothed, Figure, Portrait)
	- Timer (30s, 1 min, 2 min, ect...)
	- Number of images (10, 20, 30)

2.  Run session

3. Review
	- Re-access session images
	- Zoom/Pan

Test out a live demo here - [Live Demo](https://vghpe.github.io/stop-noodeling/demo/) 

## Home server setup:

Stop Noodling is designed to run as a web service. I’ve set it up on my Raspberry Pi so it’s always running and accessible from any device, anywhere. Apple’s PWA (“Add to Home Screen”) feature lets it function as a standalone app.

![Setup Flowchart](/images/features/img_stopnoodle.jpg)

####  My Setup Architecture:

- **Source of Truth**: MacBook Eagle Library (~20K images, 50GB)
- **Sync Layer**: Syncthing (bidirectional, always-on) keeps Mac ↔ Pi in sync
- **Server**: Raspberry Pi 5 with 2TB NVMe, runs Python HTTP server as systemd service
- **Access**: Tailscale VPN mesh allows secure access from anywhere
- **Clients**: iPad/iPhone access via PWA (Add to Home Screen)
- **Workflow**: Favorite images on iPad → metadata syncs back to Mac → appears in Eagle



### Links: 
- [Repository](https://github.com/vghpe/stop-noodeling)