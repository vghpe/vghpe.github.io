---
title: "Translating Kojima's Diary: A Dive into AI Translation"
date: 2024-09-14
draft: false
tags: ["research", "AI"]
---

I first learned about *Metal Gear Solid 2's* development diary from a [DidYouKnowGaming](https://www.youtube.com/watch?v=BVAlMgY4-5M) video on YouTube. After some online sleuthing, I discovered that the entire diary had been [uploaded to X](https://x.com/BadHumans/status/1744883721595924822). This diary was originally published in the book *Metal Gear Solid 2: The Making*, which was released exclusively in Japan 2002 and never translated into English.

I have previously used ChatGPT for various translation tasks and was impressed with its ability. Its translation of Swedish (my native language) was able to capture even the most obscure nuances, and it has been a super helpful tool as I’ve been learning Vietnamese. So, I was curious to try it out on the scans and gain insight into this never-before-translated Kojima Diary.

Before I get started I just want to make it clear that I do not speak or read Japanese. I am a curious Games Designer who wants to know how this wild game came together. 

## Phase 1
![Full Page Scan](/images/fullpage-scan.jpeg)

With an OpenAI Plus subscription, you can upload images to GPT. So, I simply dropped a full page of the scan into GPT-4 and asked it to translate everything. The chatbot complied and provided the diary entries in English.

**The Problem:**  
The translated entries initially looked good, with Kojima talking about doing motion-capture recordings. However, each diary entry pretty much contained the same information repeatedly, and the number of entries didn't seem to match what I saw on the page. GTP was simply making things up.

**Hypothesis:**  
I'm feeding it too much information at once. I've seen this behavior with GPT, where it goes off the rails or just ignores data if I try to give it too much at once.

## Phase 2
Instead of giving it a full page, I screen-grabbed smaller sections. And I [made a tool]({{< relref "posts/image_stitch.md" >}}) to quickly stitch images when the entry wrapped. This time I was getting very authentic looking translations; I could read about Kojima's daily work with his colleagues, and I could follow a game development process that I'm well familiar with. I also developed a sense of when I was overloading the chatbot.

**The Problem:**  
While this all looks very correct, I still don't know if the AI is making things up.

**Hypothesis:**  
Instead of asking GPT-4 to translate the scans directly, I'll first have it transcribe the Japanese text. I can then feed that transcript into Google Translate or DeepL. While these tools offer less contextual translation and aren't well-suited for something as esoteric as a dev diary, they can still help me verify that GPT-4 hasn't gone off track.

## Phase 3

![Cross-Compare](/images/cross-compare.png)

I set up a spreadsheet where each column included [the scanned image], [GPT-4 transcript], [GPT-4 translation], and [Google Translate]. I would spot-check a few Japanese characters at the start and end of the transcript. This was time-consuming, but I felt much more confident about the process since I was able to run that check.

**The Problem:**  
Again, GPT-4 has a way of making this look very correct. But I started getting some uneasy feelings as I was spot-checking the Japanese characters in some of the lower-quality scans. I saw errors in the transcript, with wrong characters used. I had only been checking the first and last characters of each entry. But on closer inspection, particularly on the lower-quality scans, I saw more errors.

At this point, I was getting quite ready to give up. I had no idea how much GPT-4 was making up. Mostly, it felt correct; as a game developer, I thought the general context of each entry rang true. But was it?

**Hypothesis:**  
Maybe GPT-4 has poor eyesight. It seems like old Google Translate was more capable of identifying the correct characters from those blurry scans. So, what if I instead try using Gemini to transcribe, then use a diff tool to compare the transcripts?

## Phase 4

![Meld](/images/meld.png)


Using Gemini to transcribe and then Meld to compare its transcript against GPT-4's revealed just how many errors were present in the GPT-4 version. If the diff showed 20 conflicting characters, GPT-4 would be wrong 90% of the time. Frustratingly, Gemini also made mistakes, though much less frequently.

**How do I know?**  
Well, I would painstakingly compare each character in conflict to the scan and manually correct each paragraph for the almost 200 entries.

I'm not entirely sure if the AIs were making things up, or if they were doing some re-wording or switching one Japanese script to another. Regardless, Gemini’s transcripts were almost perfect, and it was definitely better at handling the blurry scans. After several evenings of working through the text, moving corrections between GPT and Gemini (Why was I doing this again?), I had a "good" transcript for each entry.

## Phase 5
When it comes to translation, GPT-4 is just a lot better than any other tool. It's quickly apparent when asking DeepL or Gemini to try the same. Throughout GPT's translation, Kojima's personality is consistent, and if you read his Twitter, you'll recognize that voice. The development story also rings true in its rawness of personal and professional struggles. I'll share my own learnings in a future post. 

Still, this is an AI translation; there are likely to be errors. But as a game developer, I believe I've gotten a genuine insight into Kojima's process and struggle during MGS2 development. I just wouldn't quote any of the text or use it to write a book or anything before it has been properly vetted by a human translator.
