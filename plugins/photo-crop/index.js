// Plugin serving the client-side square cropper for the photo post form.
// The form loads /photo-crop/photo-crop.js via a <script> tag added by the
// @indiekit/post-type-photo patch. Cropping happens in the browser before
// upload, so the original photo in the camera roll is never touched.
const path = require('path');
const express = require('express');

class PhotoCrop {
  /**
   * @param {object} [options] - Plugin options (unused)
   */
  constructor(options = {}) {
    this.name = 'Photo crop';
    this.options = options;
    // Fixed path rather than /assets/<plugin id>, which is derived from the
    // plugin's file path and so differs between machines
    this.mountPath = '/photo-crop';
  }

  // Public so the script loads without a session; it contains nothing private
  get routesPublic() {
    return express.static(path.join(__dirname, 'assets'));
  }

  /**
   * @param {object} Indiekit - Indiekit instance
   */
  init(Indiekit) {
    Indiekit.addEndpoint(this);
  }
}

// Export as CommonJS for compatibility with dynamic import interop
module.exports = PhotoCrop;
