// .indiekitrc.js

/**
 * IndieKit configuration for Railway deployment
 * - GitHub‑backed store (content/notes) in production
 * - Falls back to local file‑system store in dev
 */

module.exports = {
  /* Optional: Atlas database URL for post cache, token storage, etc. */
  application: {
    mongodbUrl: process.env.MONGODB_URL
  },

  /* Your published website URL */
  publication: {
    me: process.env.PUBLICATION_ME
  },

  /* ---------- Store configuration ---------- */
  store: {
    /* Choose GitHub or filesystem based on env var */
    plugin:
      process.env.STORE_BACKEND === 'github'
        ? '@indiekit/store-github'
        : '@indiekit/store-file-system',

    /* Plugin‑specific options */
    options:
      process.env.STORE_BACKEND === 'github'
        ? {
            repository: process.env.GITHUB_REPOSITORY, // e.g. "vghpe/blog"
            branch:     process.env.GITHUB_BRANCH || 'main',
            path:       process.env.GITHUB_PATH   || 'content/notes',
            token:      process.env.GITHUB_TOKEN
          }
        : {
            /* Local dev: write markdown to content/notes */
            directory:  process.env.STORE_DIRECTORY || 'content/notes'
          }
  },

  /* ---------- Additional plugins ---------- */
  plugins: [
    '@indiekit/preset-hugo',
    '@indiekit/endpoint-micropub',
    '@indiekit/endpoint-media',
    '@indiekit/syndicator-bluesky',
    '@indiekit/post-type-note',
    '@indiekit/post-type-photo'
  ],

  /* ---------- Plugin options ---------- */
  '@indiekit/preset-hugo': {
    frontMatterFormat: 'yaml'
  },

  '@indiekit/syndicator-bluesky': {
    handle:   process.env.BLUESKY_HANDLE,
    password: process.env.BLUESKY_PASSWORD,
    checked:  true            // tick “Syndicate” by default in UI
  }
};
