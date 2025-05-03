// Plugin to remap Photo post type into the Notes section
class PhotoToNotes {
  /**
   * @param {object} [options] - Plugin options (unused)
   */
  constructor(options = {}) {
    this.name = 'photo-to-notes';
    this.options = options;
  }

  /**
   * Initialize plugin: override Photo post type configuration
   * to write into the notes section instead of /photos
   * @param {object} Indiekit - Indiekit instance
   */
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

// Export as CommonJS for compatibility with dynamic import interop
module.exports = PhotoToNotes;
