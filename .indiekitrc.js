// .indiekitrc.js

// Path to custom plugin for routing Note and Photo posts into the Sketchbook section
const path = require('path');
const postToSketchbookPlugin = path.join(__dirname, 'plugins', 'post-to-sketchbook.js');
const syndicatorX = path.join(__dirname, 'plugins', 'syndicator-x.js');

module.exports = {
  /* Mongo cache / token store (Atlas) */
  application: {
    mongodbUrl: process.env.MONGODB_URL      // e.g. mongodb+srv://…
  },

  /* Your public blog URL */
  publication: {
    me: process.env.PUBLICATION_ME          // https://vghpe.github.io/
  },

  /* GitHub‑backed storage */
  plugins: [
    '@indiekit/store-github',
    '@indiekit/preset-hugo',
    '@indiekit/endpoint-micropub',
    '@indiekit/endpoint-media',
    '@indiekit/syndicator-bluesky',
    syndicatorX,
    '@indiekit/post-type-note',
    '@indiekit/post-type-photo',
    postToSketchbookPlugin
  ],

  '@indiekit/store-github': {
    user:  process.env.GITHUB_USER,         // vghpe
    repo:  process.env.GITHUB_REPO,         // vghpe.github.io
    branch: process.env.GITHUB_BRANCH || 'main',
    // NOTE: if GITHUB_PATH is set in the deployment environment it overrides
    // this default and must be updated to content/sketchbook there too.
    path:   process.env.GITHUB_PATH   || 'content/sketchbook',
    token:  process.env.GITHUB_TOKEN        // PAT with “public_repo” or “repo” scope
  },

  '@indiekit/preset-hugo': {
    frontMatterFormat: 'yaml'
  },

  '@indiekit/syndicator-bluesky': {
    handle:   process.env.BLUESKY_HANDLE,   // vghpe.bsky.social
    password: process.env.BLUESKY_PASSWORD, // Bluesky password / app-password
    checked:  true                          // tick “Syndicate” by default
  },
  [syndicatorX]: {
    handle:       process.env.TWITTER_HANDLE,       // your X username
    apiKey:       process.env.TWITTER_API_KEY,       // OAuth 1.0a consumer key
    apiSecret:    process.env.TWITTER_API_SECRET,    // OAuth 1.0a consumer secret
    accessToken:  process.env.TWITTER_ACCESS_TOKEN,  // OAuth 1.0a access token
    accessSecret: process.env.TWITTER_ACCESS_SECRET, // OAuth 1.0a access secret
    checked:      true                               // tick "Syndicate" by default
  },
  // Preserve animated GIFs when resizing via Sharp
  '@indiekit/endpoint-media': {
    imageProcessing: {
      // Constrain longest side to 1000px, keep aspect ratio
      resize: {
        width: 1000,
        height: 1000,
        fit: 'inside',
        withoutEnlargement: true
      },
      // keep all frames in animated images (GIFs)
      sharpOptions: { animated: true }
    }
  }
};
