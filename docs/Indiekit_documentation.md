# IndieKit + Hugo + GitHub Pages (+ Bluesky)

A reproducible runbook for the stack that powers [vghpe.github.io](https://vghpe.github.io).

---

## Architecture

- **Client (Phone / Desktop):** Micropub + image uploads
- **IndieKit (Node.js) on Railway (serverless):**
  - GitHub store commits Markdown & media to `vghpe/vghpe.github.io` (`content/notes`)
  - MongoDB Atlas caches posts & tokens
  - Bluesky syndicator uploads note/photo via the Syndicate endpoint or GitHub Action

---

## Prerequisites & Free Tier Limits

| Tool / Service       | Free Tier Used                   |
| -------------------- | -------------------------------- |
| Node.js 20 + npm 10  | Local development                |
| MongoDB Atlas M0     | 0.5 GB                            |
| Railway Trial/Hobby  | 2 vCPU · 512 MB (serverless)     |
| GitHub PAT           | `public_repo` scope               |
| Bluesky handle/token | For syndication                   |

---

## Environment Variables (Railway → Production)

| Key                   | Description / Example                      |
| --------------------- | ------------------------------------------ |
| `MONGODB_URL`         | `mongodb+srv://user:pass@cluster0...`      |
| `PUBLICATION_ME`      | `https://vghpe.github.io/`                 |
| `GITHUB_USER`         | `vghpe`                                    |
| `GITHUB_REPO`         | `vghpe.github.io`                          |
| `GITHUB_BRANCH`       | `main` (default)                           |
| `GITHUB_PATH`         | `content/notes`                            |
| `GITHUB_TOKEN`        | (PAT with `public_repo` scope)             |
| `BLUESKY_HANDLE`      | `vghpe.bsky.social`                        |
| `BLUESKY_PASSWORD`    | (Bluesky app-password or token)            |

---

## Custom Plugin: `plugins/photo-to-notes.js`

```js
// plugins/photo-to-notes.js
class PhotoToNotes {
  constructor(options = {}) {
    this.name = 'photo-to-notes';
    this.options = options;
  }

  init(Indiekit) {
    const photo = Indiekit.postTypes.get('photo');
    if (photo) {
      photo.post.path = 'content/notes/{slug}.md';
      photo.post.url = 'notes/{slug}';
      photo.media.path = 'static/notes/{filename}';
      photo.media.url = 'notes/{filename}';
    }
  }
}

module.exports = PhotoToNotes;
```

---

## Configuration: `.indiekitrc.js`

```js
// .indiekitrc.js
const path = require('path');
const photoToNotesPlugin = path.join(__dirname, 'plugins', 'photo-to-notes.js');

module.exports = {
  application: {
    mongodbUrl: process.env.MONGODB_URL,
  },
  publication: {
    me: process.env.PUBLICATION_ME,
  },

  plugins: [
    '@indiekit/store-github',
    '@indiekit/preset-hugo',
    '@indiekit/endpoint-micropub',
    '@indiekit/endpoint-media',
    '@indiekit/syndicator-bluesky',
    '@indiekit/post-type-note',
    '@indiekit/post-type-photo',
    photoToNotesPlugin,
  ],

  '@indiekit/store-github': {
    user:   process.env.GITHUB_USER,
    repo:   process.env.GITHUB_REPO,
    branch: process.env.GITHUB_BRANCH || 'main',
    path:   process.env.GITHUB_PATH || 'content/notes',
    token:  process.env.GITHUB_TOKEN,
  },

  '@indiekit/preset-hugo': {
    frontMatterFormat: 'yaml',
  },

  '@indiekit/syndicator-bluesky': {
    handle:   process.env.BLUESKY_HANDLE,
    password: process.env.BLUESKY_PASSWORD,
    checked:  true,
  },
};
```

---

## Deployment to Railway

```bash
npm install
railway up
railway service sleeping enable
```

---

## Posting Workflow

1. Open `https://<railway-app-url>/auth` and sign in.
2. Tap **Note** or **Photo** on your device.
3. Fill in the title/body/image and **Publish**.
4. (Optional) Click **Syndicate** to post to Bluesky.

---

## Maintenance

 - **Delete test posts:** Remove markdown files from GitHub or via the IndieKit UI, then run:
```js
db.posts.deleteMany({ path: { $exists: false } });
```
 - **Rotate tokens:** Update Railway environment variables and redeploy.
 - **Cost estimate:** ≈ $0.00026 per post; $5 credit lasts years at 1 post/day.

_Last updated: 2025-05-05_
