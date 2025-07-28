---
title: Automated Media Literacy and Rhetorical Analysis of YouTube Videos
date: 2025-02-22T15:09:56
slug: media-literacy
aliases:
  - /posts/2025_02_22-mediaLiteracy/
draft: false
tags:
  - tool
  - research
---

<div class="video-wrapper">
  <figure class="video-container">
    <video width="640" height="360" controls>
      <source src="/videos/analysis.mp4" type="video/mp4">
      Your browser does not support the video tag.
    </video>
  </figure>
  <figcaption class="image-caption">
    Bernie's famous plea sitting in as our test case
  </figcaption>
</div>




There are a lot of YouTubers who release daily videos with long rants about their grievances with the video game industry. As a developer, it can be hard to take these rants at face value. <!--more-->

- They often feature a lot of misconceptions about game development
- They are often emotionally charged and sometimes just plain hateful.  
- The objectives of the content creator are dubious because they have a financial interest in creating content that provokes strong emotional reactions.  
- The videos are often long, rambling, and steeped in culture war lore.  

Is there a way to strip all that away, get to the true grievances, and work out what the actual claims are? How far away are they from the bad I see and believe is leading to more churn and less authentic art?


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

Well… yes-ish. The results vary wildly between models, but I think the tagging done by the fancy reasoning models is pretty accurate. That said, a traditional fleshy person would still do a much better job if they took their time.

But as a reader trying to understand the claims, I think the tags and highlights do help me quickly parse the text. And the summary is consistently good.

**Where does it fall apart**

Tagging 5 minutes of transcripts seems to go pretty well, but after that the AI seems to get a more 'lazy' and less detailed in it's tagging. Since most of the videos I was interested in lookint at are >10 minutes, some form of segmented call might be necessary to get a proper tagging done. 

Also, As of Feb 22, 2025, making an API call to use the fancy ChatGTO-01 model for a 10-minute transcript costs about $1, which can quickly add up when exploring the tool.


[Use the HTML highlighter tool here](/tool/index.html). You can grab YouTube's own transcript, then drop that along with the prompt into any chatbot to try it out.

[Get the full toolset and instructions here](https://github.com/vghpe/Youtube-Transcript-Rhetoric-Tagging). I found that Whisper does a better job transcribing and also doesn't censor bad language.  


