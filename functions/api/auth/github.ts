import { createStateCookie } from "../../lib/auth";
import type { Env } from "../../lib/types";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const state = crypto.randomUUID();
  const stateCookie = await createStateCookie(state, env.COOKIE_SECRET);

  const origin = env.BASE_URL ?? new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/callback`;
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    state,
    scope: "read:user",
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://github.com/login/oauth/authorize?${params.toString()}`,
      "Set-Cookie": stateCookie,
    },
  });
};
