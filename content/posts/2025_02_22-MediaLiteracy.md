---
title: "Media Literacy and Rhetorical Analysis of YouTube Rants"
date: 2025-02-22T15:09:56
draft: false
tags: ["AI", "Tools"]
image: "images/2025_02_22.jpeg"
---

There are a lot of YouTubers who release daily videos with long rants about their grievances with the video game industry. As a developer, it can be hard to take these rants at face value.

- They often feature a lot of misconceptions about game development and the industry at large.  
- They are often emotionally charged and sometimes just plain hateful.  
- The objectives of the content creator are dubious because they have a financial interest in creating content that provokes strong emotional reactions.  
- The videos are often very long, rambling, and steeped in deep culture war lore.  

Is there a way to strip all that away, get to the true grievances, and work out what the actual claims are?

Let's try using **TECHNOLOGY** to get to the core, build better communication, and save the world (or just make another tool for more hate)… Most likely, the AI will not do a great job, but let's try.

Let's mash a few tools together:

- **yt-dlp:** Used for pulling the video or audio file from YouTube.  
- **Whisper:** OpenAI’s audio-to-text model.  
- **AI APIs:** Used to tag the transcript with a few simple media literacy and rhetorical frameworks.  

<details>
<summary>Read The Prompt</summary>

```
You are a text analysis assistant. Tag the following transcript with inline markers for:  
- [FC] Factual Claim – Objective, verifiable statements.  
- [OP] Opinion – Subjective assertions.  
- [EL] Emotional Language – Language evoking emotions.  
- [RT] Rhetorical Technique – Sarcasm, irony, or rhetorical flourish.  
- [SP] Speculation – Uncertainty, guesswork, or predictions.  

**Instructions:**  
- Segment text into meaningful parts.  
- Apply inline tags without overlapping.  
- Ensure readability. Keep original wording.  

**Example:**  
Input: "Last night, there was a big announcement..."  
Output: [FC]Last night, there was a big announcement...[/FC] [EL]—everyone said...[/EL]  

**Post-Processing:**  
- Provide an "Emotional Rating" (0–10).  
- Summarize main claims, techniques, and biases.  

Now, process the following text:  

{transcript}
```
</details>

Then, we pass the tagged text into a simple HTML page that highlights the words for us.


![Factual Claims, Opinions ect has been highlighted](/images/tagging.png)

I want to be very clear: **this tool does not perform fact-checking.** A sentence tagged as a **"Factual Claim"** simply means it is presented as a fact—it does **not** verify whether it is actually true. It’s up to you to do the research and determine its accuracy.

**Does it work?**

Well... yes-ish. The results vary wildly between models, but I think the tagging done by the fancy reasoning models is pretty accurate. As of Feb 22, 2025, making an API call to use the ChatGTO-01 model for a 10-minute transcript costs about $1, which can quickly add up when exploring the tool.

Additionally, I think it would struggle with longer videos. Some form of segmented API call might be necessary.

[Check out the tools and instruction on GitHub](https://github.com/vghpe/Youtube-Transcript-Rhetoric-Tagging)



