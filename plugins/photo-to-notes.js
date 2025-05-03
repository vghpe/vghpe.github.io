export default {
  name: 'photo-to-notes',
  init(Indiekit) {
    const photo = Indiekit.postTypes.get('photo');
    if (photo) {
      photo.post.path  = 'content/notes/{slug}.md';
      photo.post.url   = 'notes/{slug}';
      photo.media.path = 'static/notes/{filename}';
      photo.media.url  = 'notes/{filename}';
    }
  }
};
