import { randomUUID } from 'crypto';
import { Router } from 'express';
import { createStateCookie } from '../../lib/auth.js';
import type { AppConfig } from '../../lib/types.js';

export function createGithubRouter(config: AppConfig) {
  const router = Router();

  router.get('/', async (req, res) => {
    const state = randomUUID();
    const stateCookie = await createStateCookie(state, config.COOKIE_SECRET);

    const origin = config.BASE_URL ?? `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${origin}/api/auth/callback`;
    const params = new URLSearchParams({
      client_id: config.GITHUB_CLIENT_ID,
      redirect_uri: redirectUri,
      state,
      scope: "read:user",
    });

    res.setHeader('Set-Cookie', stateCookie);
    res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  });

  return router;
}
