<!-- README.md -->
# blog

Just doodles.

## Table of Contents

- [Introduction](#introduction)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [YAML Configuration (`.indiekitrc.yml`)](#yaml-configuration-indiekitrcyml)
  - [JavaScript Configuration (`.indiekitrc.js`)](#javascript-configuration-indiekitrcjs)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Plugins](#plugins)
- [Custom Plugins](#custom-plugins)
- [License](#license)

## Introduction

This repository powers a micro-blog using [IndieKit](https://github.com/indiekit/indiekit) and [Hugo](https://gohugo.io/).

## Configuration

### Environment Variables

| Variable           | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `MONGODB_URL`      | MongoDB connection string (e.g. `mongodb+srv://…`)                   |
| `PUBLICATION_ME`   | Your site URL (e.g. `https://yourdomain.com/`)                      |
| `BLUESKY_HANDLE`   | Your Bluesky handle (e.g. `vghpe.bsky.social`)                     |
| `BLUESKY_PASSWORD` | Your Bluesky password                                               |
| `GITHUB_USER`      | GitHub username (for GitHub store plugin)                          |
| `GITHUB_REPO`      | GitHub repository name                                              |
| `GITHUB_TOKEN`     | GitHub Personal Access Token (with `public_repo` or `repo` scope)  |
| `GITHUB_BRANCH`    | (Optional) GitHub branch (default: `main`)                         |
| `GITHUB_PATH`      | (Optional) Path in repo for posts (default: `content/notes`)       |

### YAML Configuration (`.indiekitrc.yml`)

<details>
<summary>Example: file-system store with Hugo preset</summary>

```yaml
### IndieKit configuration for Hugo micro-blog (notes)

application:
  mongodbUrl: "mongodb://127.0.0.1:27017/indiekit"

publication:
  me: "https://vghpe.github.io/blog/"

plugins:
  - '@indiekit/store-file-system'
  - '@indiekit/preset-hugo'
  - '@indiekit/endpoint-micropub'
  - '@indiekit/endpoint-media'
  - '@indiekit/endpoint-syndicate'
  - '@indiekit/syndicator-bluesky'
  - '@indiekit/post-type-note'

'@indiekit/store-file-system':
  directory: .

'@indiekit/syndicator-bluesky':
  handle: 'vghpe.bsky.social'
  checked: true

'@indiekit/preset-hugo':
  frontMatterFormat: yaml
```
</details>

### JavaScript Configuration (`.indiekitrc.js`)

<details>
<summary>Example: GitHub store with custom plugin</summary>

```js
// .indiekitrc.js

// Import custom plugin to route Photo posts into notes
const photoToNotesPlugin = require('./plugins/photo-to-notes.js');

module.exports = {
  application: { mongodbUrl: process.env.MONGODB_URL },
  publication: { me: process.env.PUBLICATION_ME },
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
    user: process.env.GITHUB_USER,
    repo: process.env.GITHUB_REPO,
    branch: process.env.GITHUB_BRANCH || 'main',
    path: process.env.GITHUB_PATH || 'content/notes',
    token: process.env.GITHUB_TOKEN,
  },

  '@indiekit/preset-hugo': {
    frontMatterFormat: 'yaml',
  },

  '@indiekit/syndicator-bluesky': {
    handle: process.env.BLUESKY_HANDLE,
    password: process.env.BLUESKY_PASSWORD,
    checked: true,
  },
};
```
</details>

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run locally with YAML config (file-system store):
   ```bash
   npx indiekit serve --config .indiekitrc.yml
   ```

3. Run with GitHub store (JS config):
   ```bash
   npm start
   ```

## Deployment

### Railway

1. Add project environment variables in Railway Settings (see [Configuration](#configuration)).
2. Ensure `.indiekitrc.js` and `Procfile` are committed.
3. Railway will detect the `start` script and deploy the service.
4. Visit your Railway app URL or configure a custom domain.

## Plugins

- [@indiekit/store-file-system](https://www.npmjs.com/package/@indiekit/store-file-system)
- [@indiekit/store-github](https://www.npmjs.com/package/@indiekit/store-github)
- [@indiekit/preset-hugo](https://www.npmjs.com/package/@indiekit/preset-hugo)
- [@indiekit/endpoint-micropub](https://www.npmjs.com/package/@indiekit/endpoint-micropub)
- [@indiekit/endpoint-media](https://www.npmjs.com/package/@indiekit/endpoint-media)
- [@indiekit/syndicator-bluesky](https://www.npmjs.com/package/@indiekit/syndicator-bluesky)
- [@indiekit/post-type-note](https://www.npmjs.com/package/@indiekit/post-type-note)
- [@indiekit/post-type-photo](https://www.npmjs.com/package/@indiekit/post-type-photo)

## Custom Plugins

- **photo-to-notes**: Routes Photo posts into the `notes` section (see `plugins/photo-to-notes.js`).

## License

This project is licensed under the [ISC License](LICENSE).
