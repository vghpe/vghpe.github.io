---
title: "Extended Documentation"
description: "Reference for configuring, running, and deploying the blog"
---

## Overview

This site combines [Hugo](https://gohugo.io/) for static site generation with [Indiekit](https://github.com/indiekit/indiekit) for Micropub publishing. Content authored through Micropub ends up in the `content/` tree, which Hugo compiles into the `public/` directory for deployment.

- **Theme**: Based on the [`mini`](https://github.com/nodejh/hugo-theme-mini) Hugo theme, customised in `themes/mini` and `layouts/`.
- **Runtime**: Node.js application provided by Indiekit, started via the `npm start` script and configured through `.indiekitrc.js` or `.indiekitrc.yml`.
- **Storage**: Content is stored in this GitHub repository when using the GitHub store plugin, or the local filesystem when running the file-system store preset.

## Services

### Railway

Railway hosts the Indiekit service. Deployments rely on the `start` script defined in `package.json`, which runs `indiekit serve`. Ensure the environment variables listed below are set in the Railway project.

### GitHub

The repository acts as both the source for Hugo and, when the GitHub store is enabled, the destination for Micropub content. The `@indiekit/store-github` plugin requires a personal access token with `public_repo` (or `repo`) scope.

### Bluesky

Micropub posts can syndicate to Bluesky through the `@indiekit/syndicator-bluesky` plugin. Provide your handle and app password via environment variables so Indiekit can publish on your behalf.

## Environment Variables

| Variable           | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `MONGODB_URL`      | MongoDB connection string (e.g. `mongodb+srv://…`). Required when using Indiekit's queue or token storage features.
| `PUBLICATION_ME`   | Canonical site URL (e.g. `https://vghpe.github.io/`).
| `BLUESKY_HANDLE`   | Bluesky handle (e.g. `vghpe.bsky.social`).
| `BLUESKY_PASSWORD` | Bluesky app password for the Micropub syndicator.
| `GITHUB_USER`      | GitHub username for the GitHub store plugin.
| `GITHUB_REPO`      | GitHub repository name.
| `GITHUB_TOKEN`     | GitHub personal access token with `public_repo` or `repo` scope.
| `GITHUB_BRANCH`    | (Optional) Target branch for stored content. Defaults to `main`.
| `GITHUB_PATH`      | (Optional) Directory within the repo for new Micropub posts. Defaults to `content/notes`.

## IndieKit Configuration

Indiekit can be configured via YAML or JavaScript.

### `.indiekitrc.yml`

Use the YAML configuration for a file-system store, useful for local development:

```yaml
application:
  mongodbUrl: "mongodb://127.0.0.1:27017/indiekit"

publication:
  me: "https://vghpe.github.io/"

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

### `.indiekitrc.js`

For production deployments, the JavaScript configuration enables the GitHub store and additional post types. The sensitive values are pulled from environment variables:

```js
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

## Local Development

1. Install dependencies: `npm install`
2. Run the file-system store configuration: `npx indiekit serve --config .indiekitrc.yml`
3. Visit the local IndieKit endpoint to publish content into the repository.
4. Run `hugo server` in a separate terminal if you want live previews of the generated site.

When testing GitHub storage locally, export the appropriate environment variables and run `npm start` to use `.indiekitrc.js`.

## Deployment Workflow

1. Push changes to the repository to trigger any CI/CD workflow you may have configured (optional).
2. Railway automatically deploys the application by running `npm start`.
3. Railway environment variables should mirror the table above. Set the `PUBLICATION_ME` to the live site URL and ensure MongoDB credentials are available if using persistent storage.
4. Hugo output can be built locally via `hugo` if you need to publish static assets separately (for example, to GitHub Pages).

## Content Structure

- `content/notes`: Micropub notes and short updates.
- `content/posts`: Longer-form posts.
- `content/about`: About page content.
- `content/images`: Media referenced in posts.

Micropub submissions use the front matter generated by Indiekit's Hugo preset. Custom logic in `plugins/photo-to-notes.js` routes photo posts into the `notes` section.

## Troubleshooting

- Check `indiekit.log` for runtime diagnostics when running in production.
- Verify MongoDB connectivity if you see queue/token errors.
- Ensure Bluesky app passwords are regenerated periodically and updated in Railway.

## License

This project is distributed under the ISC License. See `LICENSE` for details.
