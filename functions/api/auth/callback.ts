import {
  clearStateCookie,
  createSessionCookie,
  oauthError,
  verifyState,
} from "../../lib/auth";
import type { Env } from "../../lib/types";

type TokenResponse = {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) return oauthError("Missing code or state");

  const stateOk = await verifyState(request, state, env.COOKIE_SECRET);
  if (!stateOk) return oauthError("Invalid state");

  const origin = env.BASE_URL ?? new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/callback`;

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      state,
    }),
  });

  const tokenData = (await tokenRes.json()) as TokenResponse;
  if (!tokenData.access_token) {
    return oauthError(
      tokenData.error_description ?? "Failed to fetch access token",
    );
  }

  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "User-Agent": "font-vote",
    },
  });

  if (!userRes.ok) return oauthError("Failed to fetch GitHub user");
  const userData = (await userRes.json()) as { login?: string };
  if (!userData.login) return oauthError("Missing GitHub login");

  const sessionCookie = await createSessionCookie(
    userData.login,
    env.COOKIE_SECRET,
  );
  const clearCookie = clearStateCookie();
  const headers = new Headers({ Location: "/" });
  headers.append("Set-Cookie", sessionCookie);
  headers.append("Set-Cookie", clearCookie);

  return new Response(null, {
    status: 302,
    headers,
  });
};
