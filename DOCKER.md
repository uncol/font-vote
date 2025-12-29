# Migration to Docker

## Setup Instructions

### 1. Create secrets directory and files

```bash
mkdir -p secrets
```

Create the following files in the `secrets/` directory:

- `github_client_id.txt` - Your GitHub OAuth App Client ID
- `github_client_secret.txt` - Your GitHub OAuth App Client Secret
- `cookie_secret.txt` - Random secret string (at least 32 characters)
- `admin_allowlist.txt` - Comma-separated list of GitHub usernames with admin access

Example files are provided with `.example` extension.

### 2. Generate a cookie secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" > secrets/cookie_secret.txt
```

### 3. Update GitHub OAuth callback URL

In your GitHub OAuth App settings, update the callback URL to:
```
http://your-domain.com/api/auth/callback
```

For local testing:
```
http://localhost/api/auth/callback
```

### 4. Build and run with Docker Compose

```bash
docker-compose up -d
```

```bash
docker-compose up --build -d
```

### 5. Check logs

```bash
docker-compose logs -f
```

## Configuration

Environment variables can be set in `docker-compose.yml`:

- `BASE_URL` - Base URL of your application (default: http://localhost)
- `CORS_ORIGIN` - CORS origin (default: *)
- `DB_PATH` - SQLite database path inside container (default: /data/app.db)

## Data Persistence

SQLite database is stored in a Docker volume named `db-data`. To backup:

```bash
docker run --rm -v font-vote_db-data:/data -v $(pwd):/backup alpine tar czf /backup/db-backup.tar.gz /data
```

## Development

For local development without Docker:

```bash
npm install
npm run migrate
npm run dev
```

2. Set environment variables in `.env` or export them:
```bash
export GITHUB_CLIENT_ID=xxx
export GITHUB_CLIENT_SECRET=xxx
export COOKIE_SECRET=xxx
export ADMIN_ALLOWLIST=username1,username2
# Note: Unset DB_PATH if you set it previously - the default ./data/app.db is used for local dev
# set -e DB_PATH  # fish shell
# unset DB_PATH   # bash/zsh
```

3. Run migrations:
```bash
pnpm run migrate
```

4. Start development server:
```bash
pnpm run dev
```

Server will run on http://localhost:80 (or port specified in PORT env var)

## Migration Differences from Cloudflare

- **D1 → SQLite**: Database driver changed from D1 to better-sqlite3
- **Pages Functions → Express**: Serverless functions replaced with Express routes
- **Edge Runtime → Node.js**: Full Node.js runtime available
- **Environment Variables**: Loaded from Docker secrets instead of Cloudflare bindings
- **Static Files**: Served via express.static() instead of Pages
