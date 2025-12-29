import { Router } from 'express';
import {
    clearStateCookie,
    createSessionCookie,
    verifyState,
} from '../../lib/auth.js';
import type { AppConfig } from '../../lib/types.js';

type TokenResponse = {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

export function createCallbackRouter(config: AppConfig) {
  const router = Router();

  router.get('/', async (req, res) => {
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;

    if (!code || !state) {
      return res.status(400).json({ error: "Missing code or state" });
    }

    const stateOk = await verifyState(req.headers.cookie, state, config.COOKIE_SECRET);
    if (!stateOk) {
      return res.status(400).json({ error: "Invalid state" });
    }

    const origin = config.BASE_URL ?? `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${origin}/api/auth/callback`;

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: config.GITHUB_CLIENT_ID,
        client_secret: config.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        state,
      }),
    });

    const tokenData = (await tokenRes.json()) as TokenResponse;
    if (!tokenData.access_token) {
      return res.status(400).json({
        error: tokenData.error_description ?? "Failed to fetch access token"
      });
    }

    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "font-vote",
      },
    });

    if (!userRes.ok) {
      return res.status(400).json({ error: "Failed to fetch GitHub user" });
    }
    
    const userData = (await userRes.json()) as { login?: string };
    if (!userData.login) {
      return res.status(400).json({ error: "Missing GitHub login" });
    }

    const sessionCookie = await createSessionCookie(
      userData.login,
      config.COOKIE_SECRET,
    );
    const clearCookie = clearStateCookie();

    res.setHeader('Set-Cookie', [sessionCookie, clearCookie]);
    res.redirect('/');
  });

  return router;
}
