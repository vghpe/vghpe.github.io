// Plugin to route Note and Photo post types into the Sketchbook section
// (content/sketchbook + static/images/sketchbook) instead of their defaults.
class PostToSketchbook {
  /**
   * @param {object} [options] - Plugin options (unused)
   */
  constructor(options = {}) {
    this.name = 'post-to-sketchbook';
    this.options = options;
  }

  /**
   * Initialize plugin: override Note and Photo post type configuration
   * @param {object} Indiekit - Indiekit instance
   */
  init(Indiekit) {
    for (const type of ['note', 'photo']) {
      const postType = Indiekit.postTypes.get(type);
      if (postType) {
        postType.post.path = 'content/sketchbook/{slug}.md';
        postType.post.url = 'sketchbook/{slug}';
        if (postType.media) {
          postType.media.path = 'static/images/sketchbook/{filename}';
          postType.media.url = 'images/sketchbook/{filename}';
        }
      }
    }
  }
}

// Export as CommonJS for compatibility with dynamic import interop
module.exports = PostToSketchbook;
