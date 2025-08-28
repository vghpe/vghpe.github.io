---
title: How to batch download every image and video you've liked or bookmarked on X/Twitter
date: 2025-08-25T13:17:00
draft: false
slug: twitter-dl-guide
aliases:
tags:
  - tool
image: images/img-eagle.jpg
caption: All references stored locally and organized inside Eagle.
description: Guide to download liked and bookmarked images or videos on X (Twitter)
---

The guide covers both Windows and macOS and is designed for people who haven’t used command-line tools before. Command-line tools let you talk directly to programs that don’t have a graphical interface. <!--more-->

What we’re doing here is fairly simple. Still, I encourage you to double-check the sources and confirm the commands rather than blindly trusting a blog.

On Windows we’ll use **PowerShell** (the built-in command tool), and on macOS we’ll use **Terminal** (the Mac equivalent). In this guide we’re going to use these tools:

- **gallery-dl** — the program that will download the media from X.  
- **Get cookies.txt LOCALLY** — a browser extension that saves your login session into a text file so gallery-dl can fetch your bookmarks and likes.  

Here is a very brief outline of what we’ll do:  

1. [Set up folders](#step-1-set-up-folders)  
2. [Install gallery-dl](#step-2-install-gallery-dl)  
3. [Install Get cookies.txt LOCALLY and export your cookies](#step-3-install-get-cookiestxt-locally-and-export-your-cookies)  
4. [Create the config file](#step-4-create-the-config-file)  
5. [Start downloading](#step-5-start-downloading)  


## Safety Note  
This method uses your Twitter login cookies. Cookies are small files your browser uses to stay logged in, and in this case they let gallery-dl fetch your likes and bookmarks. If someone else gets that file, they can use your account until you log out or clear sessions.

The applications we're going to use (*gallery-dl* & *Get cookies.txt LOCALLY*) are both open source, well regarded and widely checked. I recommend you confirm this yourself, never share your `cookies.txt`, and delete it when you’re done.

---
## Step 1: Set up folders

On your Desktop create a new folder called **TwitterDownloader**.  Inside it, create another folder called **downloads**.  

Your folder structure should look like this:

```
Desktop
└── TwitterDownloader
    └── downloads
```


---
## Step 2: Install gallery-dl

Now we’ll install the program that does the downloading.

**macOS**  

First open the Terminal app and use this command to download gallery-dl:
```bash
python3 -m pip install -U gallery-dl
```  
After it's done you’ll likely see a warning such as:  
```bash
WARNING: The script gallery-dl is installed in '/Users/yourname/Library/Python/3.9/bin' which is not on PATH.
```  
Note the path and version number (e.g. `3.9`). If you now try `gallery-dl --version` the command likely fails because your system doesn’t yet know where to look for the new program. 

To fix it, open Finder and go to your home folder(**CMD+Shift+H**), note the folder name (your username), then show hidden files (**CMD+Shift+.**) and open **.zshrc** (or on older macOS, **.bash_profile**). Add this line at the end:  
```bash
export PATH="/Users/yourname/Library/Python/3.9/bin:$PATH"
```  
Replace `yourname` and `3.9` with what the warning showed. Restart the terminal and check with:  
```bash
gallery-dl --version
```  
**Windows**  
1. Go to [gallery-dl github](https://github.com/mikf/gallery-dl).  
2. Scroll down to Standalone Executable and download `gallery-dl.exe`.  
3. Place `gallery-dl.exe` inside your **TwitterDownloader** folder.  

After this step, your folder should look like this:

```
Desktop
└── TwitterDownloader
    ├── downloads
    └── gallery-dl.exe   (Windows only)
```

---
## Step 3: Install Get cookies.txt LOCALLY and export your cookies

We need your Twitter login cookies so gallery-dl can fetch your likes and bookmarks.  
To do this we use a browser extension called **Get cookies.txt LOCALLY**. 

1. Install the extension:  
   - [Chrome/Edge/Brave](https://www.google.com/search?q=get+cookies+locally+chrome)  
   - [Firefox](https://www.google.com/search?q=get+cookies+locally+firefox)  

1. Go to x/Twitter and make sure you're signed in. 

2. While on the website, open the "Get cookies.txt LOCALLY" extension. Set export format to *Netscape*, Press Export As, navigate to our *TwitterDownloader* folder on the desktop and save it as:

   ```
   twitter_cookies.txt
   ```

After this step, your folder should look like this:

```
Desktop
└── TwitterDownloader
    ├── downloads
    ├── twitter_cookies.txt
    └── gallery-dl.exe   (Windows only)
```

---
## Step 4: Create the config file

We now need to create a file that tells gallery-dl what to download and where to save it.  
This file is called `config.json`.

1. Open a text editor like Notepad on Windows or TextEdit on Mac (if using TextEdit make sure you're in plaintext mode "Format > Make Plaintext") 
2. Copy the following content into the file:  

```json
{
  "base-directory": "downloads",
  "extractor": {
    "twitter": {
      "cookies": "twitter_cookies.txt",
      "videos": true,
      "retweets": false,
      "quoted": false,
      "replies": false,
      "directory": [],
      "filename": "{tweet_id}_{author[name]}_{num}.{extension}"
    }
  }
}

```
3. Save the file as **config.json** inside your **TwitterDownloader** folder.  Make sure it is saved as `config.json` and not `config.json.txt`.


### What this config does
- **base-directory** → tells gallery-dl to save everything in the `downloads` folder. 
- **cookies** → points gallery-dl to the file you exported in Step 3.  
- **videos: true** → downloads videos as well as images.  
- **retweets / quoted / replies: false** → only downloads media from original tweets you liked or bookmarked. Adjust if needed. 
- **filename** → gives every file a name that includes the tweet ID and author. 

After this step, your folder should look like this:

```
Desktop
└── TwitterDownloader
    ├── downloads
    ├── twitter_cookies.txt
    ├── config.json
    └── gallery-dl.exe   (Windows only)
```

---
# Step 5: Start downloading

We're ready to transfer! For either Windows or Mac we just need to make sure we're in the right folder:

**macOS**
On your Desktop, right-click *TwitterDownloader → Services → New Terminal at Folder.* Then one at a time run:

```bash
gallery-dl --config config.json "https://x.com/i/bookmarks"
```

```bash
gallery-dl --config config.json "https://x.com/<your-username>/likes"
```

**Windows**
On your Desktop, right-click *TwitterDownloader → Open in Terminal* (or Open PowerShell window here on older versions). Then one at a time run:

```powershell
.\gallery-dl.exe --config .\config.json "https://x.com/i/bookmarks"
```

```powershell
.\gallery-dl.exe --config .\config.json "https://x.com/<your-username>/likes"
```

---

All the media will appear inside the **downloads** folder.  Each file name will include the tweet ID, so you can always reconstruct the original link:

```
https://x.com/i/status/<tweet_id>
```
