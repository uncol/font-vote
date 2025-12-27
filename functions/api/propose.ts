import { badRequest, conflict, jsonResponse, normalizeIcon, normalizeSemantic, readJson, unauthorized } from "../lib/utils";
import { readSessionCookie } from "../lib/auth";
import type { Env } from "../lib/types";

type Payload = {
  semantic?: string;
  icon?: string;
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const session = await readSessionCookie(request, env.COOKIE_SECRET);
  if (!session) return unauthorized();

  const body = await readJson<Payload>(request);
  if (!body?.semantic || !body?.icon) return badRequest("semantic and icon are required");

  const semantic = normalizeSemantic(body.semantic);
  const icon = normalizeIcon(body.icon);
  if (!semantic || !icon) return badRequest("semantic and icon are required");

  const exists = await env.DB.prepare("SELECT semantic FROM collection1 WHERE semantic = ?")
    .bind(semantic)
    .first();
  if (!exists) return conflict("semantic does not exist");

  await env.DB.prepare(
    "INSERT INTO journal (id, semantic, icon, user, created, applied) VALUES (?, ?, ?, ?, ?, 0)"
  )
    .bind(crypto.randomUUID(), semantic, icon, session.login, new Date().toISOString())
    .run();

  return jsonResponse({ ok: true });
};
