/**
 * IndieKit configuration (JS) supporting environment variables.
 * For Railway deployment, use this file with:
 *
 *   indiekit --config .indiekitrc.js
 */
module.exports = {
  application: {
    mongodbUrl: process.env.MONGODB_URL,
  },

  publication: {
    me: process.env.PUBLICATION_ME,
  },

  plugins: [
    process.env.STORE_BACKEND === 'github'
      ? '@indiekit/store-github'
      : '@indiekit/store-file-system',
    '@indiekit/preset-hugo',
    '@indiekit/endpoint-micropub',
    '@indiekit/endpoint-media',
    '@indiekit/endpoint-syndicate',
    '@indiekit/syndicator-bluesky',
    '@indiekit/post-type-note',
  ],

  // File-system store options (local fallback)
  '@indiekit/store-file-system': {
    directory: process.env.STORE_DIRECTORY || '.',
  },

  // GitHub store options (if STORE_BACKEND=github)
  '@indiekit/store-github': {
    repository: process.env.GITHUB_REPOSITORY,
    branch: process.env.GITHUB_BRANCH || 'main',
    path: process.env.GITHUB_PATH || 'content',
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