---
title: "Making this blog"
date: 2024-08-04T18:26:20Z
draft: false
image: "/images/IMG_2590.jpg"
tags: ["blog", "dev", "github"]
---


Inspired by Hundred Rabbits art collective wiki and log site, the intention of this page is to have a lightweight way to track and log creative output, ideas, doodles. 

I had a couple of wants in mind:
- Zero cost to run and maintain.
- Full costumization control of the page. 
- Write, posts and attach images from my phone
- Controlled easily with bash commands. 

<!--more-->

After some some conversation with the chatbot I went with static site generator Hugo. I relied heavily on the chatbot to help with a initial setup and then to deploy to github pages with automated actions. That mostly worked but I didn't quite understand what what happening. But it showed me what was possible. 

For a second setup I just used the Hugo documentation. It was easy to follow along and I got a proper undestanding of how the whole process worked. The theme i used is a slightly modified version of Mini.

To be able to post from my phone. I use Working Copy App which is a git client for iOS that closes the repositoriy to your Files directory. I then used shortcut to string to gether a series of actions. 

1. Text input for title
2. Text input for post body. 
3. Ask if I want to include an. 
4. Then create and save a Markdown file with the input
5. Commit and push 

Since the github action rebuilds the site completly it takes about 30 seconds for the post to be live. I guess that's very fast concidering. 
