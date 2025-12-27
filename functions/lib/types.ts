export type Env = {
  DB: D1Database;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  COOKIE_SECRET: string;
  ADMIN_ALLOWLIST?: string;
  BASE_URL?: string;
};
