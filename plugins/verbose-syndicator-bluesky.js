import BlueskySyndicator from '@indiekit/syndicator-bluesky';

export default class VerboseBlueskySyndicator extends BlueskySyndicator {
  /**
   * @param {object} options - Plugin options from .indiekitrc.yml
   */
  constructor(options) {
    super(options);
  }

  /**
   * Register plugin with IndieKit and log a confirmation
   */
  init(Indiekit) {
    console.info(`✓ Loaded Bluesky syndicator for ${this.options.handle}`);
    super.init(Indiekit);
  }
}