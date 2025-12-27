import { jsonResponse } from "../lib/utils";
import { readSessionCookie } from "../lib/auth";
import { parseAllowlist, isAdmin } from "../lib/admin";
import type { Env } from "../lib/types";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const session = await readSessionCookie(request, env.COOKIE_SECRET);
  const allowlist = parseAllowlist(env.ADMIN_ALLOWLIST);
  const login = session?.login ?? null;
  return jsonResponse({
    user: login,
    isAdmin: isAdmin(login, allowlist),
  });
};
