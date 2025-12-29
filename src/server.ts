import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from './lib/auth.js';
import { initDb } from './lib/db.js';
import type { AppConfig } from './lib/types.js';

import { createAdminApplyRouter } from './routes/admin/apply.js';
import { createAdminCollection1Router } from './routes/admin/collection1.js';
import { createCallbackRouter } from './routes/auth/callback.js';
import { createGithubRouter } from './routes/auth/github.js';
import collection1Router from './routes/collection1.js';
import journalRouter from './routes/journal.js';
import manifestRouter from './routes/manifest.js';
import { createMeRouter } from './routes/me.js';
import proposeRouter from './routes/propose.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config from Docker secrets or environment variables
function loadSecret(name: string): string {
  try {
    return readFileSync(`/run/secrets/${name}`, 'utf-8').trim();
  } catch {
    const envValue = process.env[name];
    if (!envValue) {
      throw new Error(`Missing required secret or env var: ${name}`);
    }
    return envValue;
  }
}

const config: AppConfig = {
  GITHUB_CLIENT_ID: loadSecret('GITHUB_CLIENT_ID'),
  GITHUB_CLIENT_SECRET: loadSecret('GITHUB_CLIENT_SECRET'),
  COOKIE_SECRET: loadSecret('COOKIE_SECRET'),
  ADMIN_ALLOWLIST: process.env.ADMIN_ALLOWLIST || loadSecret('ADMIN_ALLOWLIST'),
  BASE_URL: process.env.BASE_URL,
};

// Initialize database
const dbPath = process.env.DB_PATH || '/data/app.db';
initDb(dbPath);

const app = express();
const port = parseInt(process.env.PORT || '80', 10);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(authMiddleware(config));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/collection1', collection1Router);
app.use('/api/journal', journalRouter);
app.use('/api/manifest', manifestRouter);
app.use('/api/me', createMeRouter(config));
app.use('/api/propose', proposeRouter);
app.use('/api/admin/collection1', createAdminCollection1Router(config));
app.use('/api/admin/apply', createAdminApplyRouter(config));
app.use('/api/auth/github', createGithubRouter(config));
app.use('/api/auth/callback', createCallbackRouter(config));

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
