---
title: "Comparing Opening Dialogues: A Short Hike vs. Arranger"
date: 2024-12-25
tags: ["game writing", "dialogue analysis", "game design"]
draft: true
---

TEST TEST DRAFT

One of my favorite games this year was *Arranger*, a tile-based puzzle adventure game. I played it on my iPad as I was recovering from a cold and was charmed by the style and excellent puzzle design. It was cozy, and a unique game that let me work through it at my own pace.  

However, I found myself struggling somehow with the text and dialogue. My focus would quickly drift, and I struggled to parse the sentences. Was it the writing or the presentation? Am I just too much of a simpleton?

Let’s compare *Arranger* to another game, *A Short Hike*, which also uses a similar dialogue design. I specifically remember being very drawn in by its dialogue. 

Discalimer, I'm not a writer, english is my second languge and I've struggled struggled struggled with prose, so here is me trying to understand I had a preference for one over the other. First, let's start with a high-level look at how the dialogue systems are deployed.  

---

## NPC Engagment Design

*Arranger* uses a traditional adventure game flow for NPC conversations. An engagement is commonly force-triggered on approach. Once the dialogue is done, the player can chooce to re-engage the NPC for a short affirmation script (usually to remind the player of the goal) that can be re-triggered indefinitly. 

*A Short Hike* leans into player agency and the toy-box nature of its core design. NPC engagement is always player-controlled and (entirely?) optional. 

It also uses a re-engagement design I'm a big fan of. On engagement, high-level information is frontloaded with a short script, when the player is released from the conversation, they can choose to re-engage for more narrative details or just move on. The twitchy player can go jump off a rock, and the curious player can get to know the characters more. 


---

## The Scripts

Here's the script for for the first NPC interactions in both game. 

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


#### Arranger

> **JEMMA**  
> Morning, Susie Q!  

> **SUSIE**  
> I've ASKED you not to call me that, Jemma.  Susie, or Miss Susie will do just fine.  

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



I'm sure there are many linguistic descriptions that can be used here. Again, I'm not a writer, so here's how I describe the difference: *A Short Hike*'s text feels like a conversation, and *Arranger*'s text feels like I'm reading "writing." 

There's also something nice about the very brief and short text in *A Short Hike* that I like. It's like I can parse it within a breath, and I'm not tripping over the words in my head. 

---

## Animation -  Text & Character

Both games animate the characters. *Arranger* appears to do a ping-pong ease on the sprite, while *A Short Hike* translates or scales the heads on the Y-axis.  

---

## The Beeps

I reached out to Adam Robinson-Yu creator of A Short Hike and he actually shared send me the code snippet of the text beep functionallity used in the game.  

Each frame, a number of text characters are revealed based on a set speed. A beep sound (chosen randomly from a predefined set) plays if any characters are revealed and a certain amount of time has passed since the last beep.

I didn't ask Adam if all NPC uses the same bank, my guess is: yes, but each NPC is assigned a pitch shift giving eveyone an unique voice which also makes the back and forth the feel of 2 different people talking.



