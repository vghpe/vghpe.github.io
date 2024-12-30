---
title: "Comparing Dialogues: A Short Hike vs. Arranger"
date: 2024-12-25
tags: ["game writing", "dialogue analysis", "game design"]
draft: true
---

One of my favorite games this year was *Arranger*, a tile-based puzzle adventure game. I played it on my iPad as I was recovering from a cold and was charmed by its style and excellent puzzle design.

However, I found myself struggling with the text and dialogue. My focus would quickly drift, and I struggled to parse the sentences. Why?

Let’s break it down and compare *Arranger* to another game, *A Short Hike*, which uses a similar dialogue design. But I remember being very drawn in by *A Short Hike*'s dialogue.

**Disclaimer:** I'm not a writer, and English is my second language, so here is me trying to understand why I had a preference for one over the other. First, let's start with a high-level look at how the dialogue systems are deployed.

---

## NPC Engagement Design

*Arranger* uses a traditional adventure game flow for NPC conversations. An engagement is commonly force-triggered on approach. Once the dialogue is done, the player can choose to re-engage the NPC for a short affirmation script (usually to remind the player of the goal) that can be re-triggered indefinitely.

[Image of flow]

*A Short Hike* leans into player agency and the toy-box nature of its core design. NPC engagement is always player-controlled and (entirely?) optional.

It also uses a re-engagement design I'm a big fan of. On engagement, high-level information is frontloaded with a short script. When the player is released from the conversation, they can choose to re-engage for more narrative details or just move on. The twitchy player can go jump off a rock, and the curious player can get to know the characters more.

[Another flow]

---

## The Scripts

Here's the script for the first NPC interactions in both games.

#### A Short Hike

> **AUNT MAY**  
> How's it going?  
> I haven't seen you all day.  
> You been busy?  

> **CLAIRE**  
> Uh, kinda.  
> Well, not really.  
> I've just been waiting for a call.  

<details>
<summary>Expand Script</summary>

> **AUNT MAY**  
> Well, there's your problem!  
> There is no reception out here.  

> **CLAIRE**  
> Wait,  
> WHAT!?  

> **AUNT MAY**  
> Yeah, I mean, pretty much no reception.  
> You might be able to get some at Hawk Peak.  

> **CLAIRE**  
> Oh... yeah, I guess.  
> But that's pretty far, isn't it?  

> **AUNT MAY**  
> It's not that far!  
> We've all made the trek before.  
> I figured you would have gone already.  

> **CLAIRE**  
> Oh... yeah.  
> I've been meaning to go.  
> But... I just... I haven't gotten around to it yet.  

> **AUNT MAY**  
> Well, today's as good a day as any.  

> **CLAIRE**  
> ...  

> **AUNT MAY**  
> Just take White Beach Trail and head north at the fork.  
> Then follow the signs to Hawk's Peak.  
> No problem!

</details>

---

#### Arranger

> **JEMMA**  
> Morning, Susie Q!  

> **SUSIE**  
> I've ASKED you not to call me that, Jemma. Susie, or Miss Susie will do just fine.  

<details>
<summary>Expand Script</summary>

> **JEMMA**  
> Aw, c'mon! This might be the last day I ever get to use it!  
> Wouldn't that be sad if you never got to hear it again?  

> **SUSIE**  
> Devastating. Now today's a big day. Are you feeling ready?  
> You'll need to be prepared for anything out there...  
> ...no one would blame you if today WEREN'T the day, after all...  

> **JEMMA**  
> It's the day, Miss Susie! I'm ready!  

> **SUSIE**  
> Hmm. It pains me to say it, but you actually DO look ready this time.  

> **JEMMA**  
> I am! Will you come with me to open the gate?  

> **SUSIE**  
> I wouldn't miss it. Now where did I put that gate key?  

</details>

---

I'm sure there are linguistic descriptions that can be used here. Again, I'm not a writer, so I'd describe the difference as: *A Short Hike*'s text feels like a conversation, and *Arranger*'s text feels more like writing.

There's something I appreciate about the very brief lines in *A Short Hike*. It's like I can parse each one in a breath and then move on.

*Arranger*'s lines are wordier, maybe more poetic, but I'm unable to flow through them in the same manner. There are several full stops within a line, and it occasionally deploys "eye dialect"—spelling that suggests a character's accent—which consistently trips me up. This, I think, contributes to me losing the conversational rhythm.

---

## The Text - Presentation and Features

The text speed in both games is fast. Neither game offers options to adjust text speed (some players have a preference for instant text reveal) but both games let allows tap to instantly complete the line. 

Legibility in both games is excellent. The fonts are sharp and contrast well against the text boxes. *Arranger* plays a sound effect with each new box, while *A Short Hike* plays one when the speaker changes. *Arranger* also uses an idle animation on the text boxes, which keeps the screen from feeling too static.

Both games animate the characters. *Arranger* appears to use a ping-pong ease on the sprite, while *A Short Hike* translates or scales the heads on the Y-axis.

---

## The Beeps

I couldn't quite work out how the beeps were implemented just by looking at footage, so I reached out to Adam Robinson-Yu, creator of *A Short Hike*, and he actually sent me the code snippet of the text beep functionality used in the game.

>Each frame a number of characters are revealed based on a set speed. Whenever a character is revealed, it plays a beep (from a random set) if a certain amount of time has passed since the last beep.

I didn't ask Adam if all NPCs use the same sound bank. My guess is: yes, but each NPC is assigned a pitch shift, giving everyone a unique voice, which also makes the back-and-forth feel like two different people talking.

*Arranger*'s beeps appear to be implemented very similarly, but there is no variation between NPCs. The same pitch and sound bank are always used. They’ve done something quite unique with the sound design, though, which I’ve never heard before. It doesn’t try so much to be a voice like *A Short Hike*, but the "bloops" still have more personality through their variation than the typewriter sounds you find in *Ace Attorney* and many other visual novels.

---

## Summary

Each frame, a number of text characters are revealed based on a set speed. A beep sound (chosen randomly from a predefined set) plays if any characters are revealed and a certain amount of time has passed since the last beep.

