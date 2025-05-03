// .indiekitrc.js
module.exports = {
  /* Optional: Atlas URL, token storage, etc. */
  application: {
    mongodbUrl: process.env.MONGODB_URL
  },

  /* Your public site URL */
  publication: {
    me: process.env.PUBLICATION_ME
  },

  /* Load plugins, including the GitHub store */
  plugins: [
    '@indiekit/store-github',
    '@indiekit/preset-hugo',
    '@indiekit/endpoint-micropub',
    '@indiekit/endpoint-media',
    '@indiekit/syndicator-bluesky',
    '@indiekit/post-type-note',
    '@indiekit/post-type-photo'
  ],

  /* ---------- Plugin‑specific configuration ---------- */

  /* GitHub‑backed storage */
  '@indiekit/store-github': {
    repository: process.env.GITHUB_REPOSITORY, // "vghpe/blog"
    branch:     process.env.GITHUB_BRANCH  || 'main',
    path:       process.env.GITHUB_PATH    || 'content/notes',
    token:      process.env.GITHUB_TOKEN
  },

  /* Hugo front‑matter style */
  '@indiekit/preset-hugo': {
    frontMatterFormat: 'yaml'
  },

  /* Bluesky syndication */
  '@indiekit/syndicator-bluesky': {
    handle:   process.env.BLUESKY_HANDLE,
    password: process.env.BLUESKY_PASSWORD,
    checked:  true   // tick “Syndicate” by default
  }
};
