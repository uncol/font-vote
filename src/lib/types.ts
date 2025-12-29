import type { Request } from 'express';

export interface AppConfig {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  COOKIE_SECRET: string;
  ADMIN_ALLOWLIST?: string;
  BASE_URL?: string;
}

export interface Session {
  login: string;
  exp: number;
}

export interface AuthRequest extends Request {
  session?: Session;
}
