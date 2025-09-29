// .indiekitrc.js

// Path to custom plugin for routing Photo posts into the Notes section
const path = require('path');
const photoToNotesPlugin = path.join(__dirname, 'plugins', 'photo-to-notes.js');

module.exports = {
  /* Mongo cache / token store (Atlas) */
  application: {
    mongodbUrl: process.env.MONGODB_URL      // e.g. mongodb+srv://…
  },

  /* Your public blog URL */
  publication: {
    me: process.env.PUBLICATION_ME          // https://vghpe.github.io/blog/
  },

  /* GitHub‑backed storage */
  plugins: [
    '@indiekit/store-github',
    '@indiekit/preset-hugo',
    '@indiekit/endpoint-micropub',
    '@indiekit/endpoint-media',
    '@indiekit/syndicator-bluesky',
    '@indiekit/post-type-note',
    '@indiekit/post-type-photo',
    photoToNotesPlugin
  ],

  '@indiekit/store-github': {
    user:  process.env.GITHUB_USER,         // vghpe
    repo:  process.env.GITHUB_REPO,         // blog
    branch: process.env.GITHUB_BRANCH || 'main',
    path:   process.env.GITHUB_PATH   || 'content/notes',
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
