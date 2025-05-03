# blog
Just doodles

## Railway Deployment

To deploy IndieKit on Railway:

1. In your Railway project settings, set the following environment variables:
   - MONGODB_URL: MongoDB connection string (e.g. your Atlas URI)
   - PUBLICATION_ME: Your site URL (e.g. https://yourdomain.com/)
   - BLUESKY_HANDLE: Your Bluesky username (e.g. "vghpe.bsky.social")
   - BLUESKY_PASSWORD: Your Bluesky password
   - (Optional) STORE_BACKEND: Set to "github" to use the GitHub store plugin
   - If using GitHub store:
     - GITHUB_REPOSITORY: repository in "owner/name" format
     - GITHUB_TOKEN: GitHub personal access token
     - GITHUB_BRANCH: Branch name (default: "main")
     - GITHUB_PATH: Path in the repo for posts (default: "content")

2. Ensure `.indiekitrc.js` and `Procfile` are committed to your repo.

3. Railway will detect the `start` script (`npm start`) and run:
   ```bash
   indiekit --config .indiekitrc.js
   ```

4. Once deployed, visit your Railway app URL or configure a custom domain.

For local development with the existing YAML config, continue using:
```bash
npx indiekit --config .indiekitrc.yml
```
