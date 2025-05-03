/**
 * .indiekitrc.js
 * Explicitly configure the store plugin so its options get picked up.
 */
module.exports = {
  application: {  
    mongodbUrl: process.env.MONGODB_URL  
  },

  publication: {  
    me: process.env.PUBLICATION_ME  
  },

  // === replace your plugins/store setup with this ===
  store: {
    plugin: process.env.STORE_BACKEND === 'github'
      ? '@indiekit/store-github'
      : '@indiekit/store-file-system',
    options: process.env.STORE_BACKEND === 'github'
      ? {
          repository: process.env.GITHUB_REPOSITORY,   // e.g. "vghpe/blog"
          branch:     process.env.GITHUB_BRANCH  || 'main',
          path:       process.env.GITHUB_PATH    || 'content/notes',
          token:      process.env.GITHUB_TOKEN
        }
      : {
          directory: process.env.STORE_DIRECTORY || '.'
        }
  },

  // now list the rest of your non‐store plugins
  plugins: [
    '@indiekit/preset-hugo',
    '@indiekit/endpoint-micropub',
    '@indiekit/endpoint-media',
    '@indiekit/endpoint-syndicate',
    '@indiekit/syndicator-bluesky',
    '@indiekit/post-type-note',
  ],

  '@indiekit/preset-hugo': {
    frontMatterFormat: 'yaml'
  },

  '@indiekit/syndicator-bluesky': {
    handle:   process.env.BLUESKY_HANDLE,
    password: process.env.BLUESKY_PASSWORD,
    checked:  true
  }
};
