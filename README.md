# Font Vote (Cloudflare Pages + D1)

## Setup

### 1) Install wrangler (if needed)

```
npm i -g wrangler
```

### 2) Create D1 database

```
wrangler d1 create font-vote
```

Copy the returned `database_id` into `wrangler.toml`.

### 3) Create Pages project (optional if deploying first time)

```
wrangler pages project create font-vote
```

### 4) Configure secrets/vars

```
wrangler pages secret put GITHUB_CLIENT_ID --project-name font-vote
wrangler pages secret put GITHUB_CLIENT_SECRET --project-name font-vote
wrangler pages secret put COOKIE_SECRET --project-name font-vote
wrangler pages secret put ADMIN_ALLOWLIST --project-name font-vote
wrangler pages secret put BASE_URL --project-name font-vote
```

Notes:
- `COOKIE_SECRET` should be a random 32+ char string (e.g. from `openssl rand -hex 32`).
- `ADMIN_ALLOWLIST` is a comma-separated list of GitHub logins.
- `BASE_URL` is optional; use the public origin (e.g. `https://font-vote.pages.dev`).

### 5) Apply migrations

Local:
```
wrangler d1 execute font-vote --file migrations/0001_init.sql
```

Production:
```
wrangler d1 execute font-vote --file migrations/0001_init.sql --remote
```

### 6) Seed initial data (optional)

Local:
```
wrangler d1 execute font-vote --file seed_collection1_from_input.sql
```

Production:
```
wrangler d1 execute font-vote --file seed_collection1_from_input.sql --remote
```

### 7) Deploy

```
wrangler pages deploy public --project-name font-vote
```

## Endpoints

- `GET /api/collection1` (semantic/icon search, sort)
- `GET /api/journal` (semantic/user filter, created sort)
- `GET /api/me` (session info)
- `GET /api/auth/github` (OAuth start)
- `GET /api/auth/callback` (OAuth callback)
- `POST /api/propose` (auth required)
- `POST /api/admin/collection1` (admin add)
- `PUT /api/admin/collection1` (admin edit)
- `DELETE /api/admin/collection1` (admin delete)
- `POST /api/admin/apply` (admin apply)

## Local dev

```
wrangler pages dev public
```
http://localhost:8788
