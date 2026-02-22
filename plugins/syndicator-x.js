// X (Twitter) syndicator plugin for Indiekit
// Follows the same interface as @indiekit/syndicator-bluesky

const { TwitterApi } = require('twitter-api-v2');

const defaults = {
  handle: '',
  apiKey: '',
  apiSecret: '',
  accessToken: '',
  accessSecret: '',
  checked: false,
  includePermalink: false,
};

/**
 * Convert HTML content to plain text suitable for a tweet
 * @param {string} html - HTML content
 * @returns {string} Plain text
 */
function htmlToPlainText(html) {
  if (!html) return '';

  // Extract last link href before stripping tags
  const hrefMatches = [...html.matchAll(/href="(https?:\/\/.+?)"/g)];
  const lastHref = hrefMatches.length > 0 ? hrefMatches.at(-1)[1] : null;

  // Strip HTML tags
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();

  // Append the last link if present (matches Bluesky behaviour)
  if (lastHref) {
    text = `${text} ${lastHref}`;
  }

  return text;
}

/**
 * Truncate text to fit within Twitter's 280 character limit
 * Appends permalink if the text was truncated or includePermalink is true
 * @param {string} text - Text to truncate
 * @param {string} url - Permalink URL
 * @param {boolean} includePermalink - Whether to always include permalink
 * @returns {string} Truncated text
 */
function truncateForTwitter(text, url, includePermalink) {
  // Twitter counts t.co-wrapped URLs as 23 characters
  const URL_LENGTH = 23;
  const MAX_LENGTH = 280;

  if (!text) return url || '';

  // If the text has a title, format as "Title URL"
  // (handled in getPostText below)

  if (includePermalink) {
    // Reserve space for "\n\nURL" (2 newlines + 23 chars for t.co)
    const available = MAX_LENGTH - URL_LENGTH - 2;
    if (text.length > available) {
      text = text.slice(0, available - 1).trimEnd() + '…';
    }
    return `${text}\n\n${url}`;
  }

  if (text.length <= MAX_LENGTH) {
    return text;
  }

  // Text is too long — truncate and append permalink
  const available = MAX_LENGTH - URL_LENGTH - 2; // "\n\n" + URL
  text = text.slice(0, available - 1).trimEnd() + '…';
  return `${text}\n\n${url}`;
}

/**
 * Build tweet text from JF2 properties
 * @param {object} properties - JF2 properties
 * @param {boolean} includePermalink - Whether to include permalink
 * @returns {string} Tweet text
 */
function getPostText(properties, includePermalink) {
  let text;

  if (properties.name && properties.name !== '') {
    // Post has a title — show "Title URL"
    text = `${properties.name} ${properties.url}`;
    if (text.length <= 280) return text;
    // If still too long, truncate the title
    const available = 280 - 23 - 1; // URL + space
    text = properties.name.slice(0, available - 1).trimEnd() + '…';
    return `${text} ${properties.url}`;
  }

  if (properties.content && properties.content.html) {
    text = htmlToPlainText(properties.content.html);
  } else if (properties.content && typeof properties.content === 'string') {
    text = properties.content;
  } else {
    text = '';
  }

  return truncateForTwitter(text, properties.url, includePermalink);
}

class XSyndicator {
  /**
   * @param {object} [options] - Plugin options
   * @param {string} [options.handle] - X handle (without @)
   * @param {string} [options.apiKey] - OAuth 1.0a consumer/API key
   * @param {string} [options.apiSecret] - OAuth 1.0a consumer/API secret
   * @param {string} [options.accessToken] - OAuth 1.0a access token
   * @param {string} [options.accessSecret] - OAuth 1.0a access token secret
   * @param {boolean} [options.checked] - Check syndicator in UI
   * @param {boolean} [options.includePermalink] - Include permalink in tweet
   */
  constructor(options = {}) {
    this.name = 'X syndicator';
    this.options = { ...defaults, ...options };
  }

  get #user() {
    return this.options?.handle
      ? `@${this.options.handle.replace('@', '')}`
      : false;
  }

  get environment() {
    return [
      'TWITTER_API_KEY',
      'TWITTER_API_SECRET',
      'TWITTER_ACCESS_TOKEN',
      'TWITTER_ACCESS_SECRET',
    ];
  }

  get info() {
    const handle = this.options.handle.replace('@', '');
    const url = `https://x.com/${handle}`;

    const info = {
      checked: this.options.checked,
      name: this.#user,
      uid: url,
      service: {
        name: 'X',
        photo: 'https://abs.twimg.com/favicons/twitter.3.ico',
        url: 'https://x.com',
      },
      user: {
        name: this.#user,
        url,
      },
    };

    if (!this.#user) {
      info.error = 'X handle required';
    }

    return info;
  }

  /**
   * Create an authenticated Twitter API v2 client (user context)
   * @returns {TwitterApi} Authenticated client
   */
  #client() {
    return new TwitterApi({
      appKey: this.options.apiKey,
      appSecret: this.options.apiSecret,
      accessToken: this.options.accessToken,
      accessSecret: this.options.accessSecret,
    });
  }

  /**
   * Upload media (image) to Twitter
   * @param {object} media - JF2 media object with url property
   * @param {string} me - Publication URL
   * @returns {Promise<string|undefined>} Media ID string
   */
  async uploadMedia(media, me) {
    const { url } = media;
    if (typeof url !== 'string') return;

    try {
      // Resolve relative URLs against the publication URL
      const mediaUrl = url.startsWith('http') ? url : new URL(url, me).href;

      // Download the image
      const response = await fetch(mediaUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch media: ${response.status} ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      // Upload via v1.1 media upload endpoint
      const client = this.#client();
      const mediaId = await client.v1.uploadMedia(buffer, {
        mimeType: contentType,
      });

      return mediaId;
    } catch (error) {
      console.error(`[X syndicator] Media upload failed: ${error.message}`);
      // Don't throw — post the tweet without the image
      return undefined;
    }
  }

  /**
   * Syndicate a post to X
   * @param {object} properties - JF2 properties
   * @param {object} publication - Publication object
   * @returns {Promise<string|undefined>} URL of syndicated tweet
   */
  async syndicate(properties, publication) {
    try {
      const client = this.#client();
      const handle = this.options.handle.replace('@', '');
      const me = publication.me;

      // Build tweet text
      const text = getPostText(properties, this.options.includePermalink);

      // Upload images (max 4)
      let mediaIds = [];
      if (properties.photo) {
        const photos = properties.photo.slice(0, 4);
        const uploads = await Promise.all(
          photos.map((photo) => this.uploadMedia(photo, me))
        );
        mediaIds = uploads.filter(Boolean);
      }

      // Build tweet payload
      const tweetData = { text };
      if (mediaIds.length > 0) {
        tweetData.media = { media_ids: mediaIds };
      }

      // Post the tweet
      const result = await client.v2.tweet(tweetData);
      const tweetId = result.data.id;

      // Return the syndicated URL
      return `https://x.com/${handle}/status/${tweetId}`;
    } catch (error) {
      const message = error.message || 'Unknown error posting to X';
      console.error(`[X syndicator] ${message}`);
      throw new Error(message);
    }
  }

  init(Indiekit) {
    Indiekit.addSyndicator(this);
  }
}

// Export as CommonJS for compatibility with dynamic import interop
module.exports = XSyndicator;
