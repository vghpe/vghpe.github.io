---
title: "Saving Your References"
date: 2024-08-11T12:00:00Z
draft: false
tags: ["gamesindustry", "ai", "transcripts"]
---

{{< video src="/videos/segment_20240811_171525_480p.mp4" type="video/mp4" width="640" height="360" >}}


I had planned to write about MSG2 and level design today, but I got sidetracked in my mission to find a tangential rant by ([Super Bunnyhop](https://www.youtube.com/channel/UCWqr2tH3dPshNhPjV5h1xRw)). I saw this on his live stream a few months ago and thought it was such an interesting statement that I've been thinking about it a lot. However, that too is a topic for another day.  

Instead, I want to talk about the clip itself, the mp4 file you see render on this page. I've been using `yt-dlp` a fair bit recently to save videos from youtube, mostly from no-commentary gameplay videos, capturing some interesting design elements. I mostly use it to share privately with my collaborators. While I could have ([linked a YouTube video with a timestamp](https://www.youtube.com/watch?v=QQD-wjeFr10&t=1786s)), so much YouTube content has been lost over the years. My "Liked" video playlist on YouTube is 30% broken links, which is frustrating.

I've expanded a bit on the typical `yt-dlp` download command and [wrote a segment downloader as a PowerShell script.](/scripts/yt-downloader-segments.txt)

<!--more-->


It's really useful since most of the time, I'm only interested in a small clip and don't want to download a full 5-hour video.

You'll need to adjust these parameters:
- `YOUTUBE_LINK = "https://www.youtube.com/watch?v=QQD-wjeFr10"`
- `START_TIME = "00:29:22"`
- `END_TIME = "00:30:10"`

To generate subtitles, I saw today as an opportunity to learn how some of these new AI transcription tools work. OpenAI has released Whisper ([GitHub link](https://github.com/openai/whisper)), an open-source "general-purpose speech recognition model" that can be run locally.

I ended up using WhisperX ([GitHub link](https://github.com/m-bain/whisperX)), a fork that is supposedly a slimmer versi)on. I just ran the command as listed in the GitHub setup. It had to install a lot of packages, but in the end, it worked great. I gave it the segmented YouTube video, and it generated an SRT file with a perfect transcript.

I then used `ffmpeg` to convert that into a VTT file ([full transcript](/videos/segment_20240811_171525.vtt)), and that's what you see above. 

There are some ethical considerations here, I'm grabbing this clip without permission and rebublishing it on my blog even if I credit the creator it's a bit iffy and I'll probalbly need to reconsider this post of this page ever become more than a personal log. 