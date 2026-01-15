import { isAdmin, parseAllowlist } from "../../lib/admin";
import { readSessionCookie } from "../../lib/auth";
import type { Env } from "../../lib/types";
import { badRequest, conflict, forbidden, jsonResponse, normalizeIcon, normalizeSemantic, notFound, readJson, unauthorized } from "../../lib/utils";

type Payload = {
  semantic?: string;
  icon?: string;
};

async function requireAdmin(request: Request, env: Env) {
  const session = await readSessionCookie(request, env.COOKIE_SECRET);
  if (!session) return { error: unauthorized(), login: null };
  const allowlist = parseAllowlist(env.ADMIN_ALLOWLIST);
  if (!isAdmin(session.login, allowlist)) return { error: forbidden(), login: null };
  return { error: null, login: session.login };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const body = await readJson<Payload>(request);
  if (!body?.semantic || !body?.icon) return badRequest("semantic and icon are required");

  const semantic = normalizeSemantic(body.semantic);
  const icon = normalizeIcon(body.icon);
  if (!semantic || !icon) return badRequest("semantic and icon are required");

  try {
    await env.DB.prepare("INSERT INTO collection1 (semantic, icon) VALUES (?, ?)")
      .bind(semantic, icon)
      .run();
  } catch {
    return conflict("semantic already exists");
  }

  await env.DB.prepare(
    "INSERT INTO journal (id, semantic, icon, user, created, applied) VALUES (?, ?, ?, ?, ?, 0)"
  )
    .bind(crypto.randomUUID(), semantic, icon, auth.login, new Date().toISOString())
    .run();

  return jsonResponse({ ok: true });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const body = await readJson<Payload>(request);
  if (!body?.semantic || !body?.icon) return badRequest("semantic and icon are required");

  const semantic = normalizeSemantic(body.semantic);
  const icon = normalizeIcon(body.icon);
  if (!semantic || !icon) return badRequest("semantic and icon are required");

  const result = await env.DB.prepare("UPDATE collection1 SET icon = ? WHERE semantic = ?")
    .bind(icon, semantic)
    .run();
  if (!result.success || result.changes === 0) return notFound("semantic not found");

  await env.DB.prepare(
    "INSERT INTO journal (id, semantic, icon, user, created, applied) VALUES (?, ?, ?, ?, ?, 0)"
  )
    .bind(crypto.randomUUID(), semantic, icon, auth.login, new Date().toISOString())
    .run();

  return jsonResponse({ ok: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const body = await readJson<Payload>(request);
  if (!body?.semantic) return badRequest("semantic is required");

  const semantic = normalizeSemantic(body.semantic);
  if (!semantic) return badRequest("semantic is required");

  // Получаем текущий icon перед удалением для журнала
  const current = await env.DB.prepare("SELECT icon FROM collection1 WHERE semantic = ?")
    .bind(semantic)
    .first<{ icon: string }>();
  if (!current) return notFound("semantic not found");

  const result = await env.DB.prepare("DELETE FROM collection1 WHERE semantic = ?")
    .bind(semantic)
    .run();
  if (!result.success || result.changes === 0) return notFound("semantic not found");

  // Логируем удаление с пометкой в icon
  await env.DB.prepare(
    "INSERT INTO journal (id, semantic, icon, user, created, applied) VALUES (?, ?, ?, ?, ?, 0)"
  )
    .bind(crypto.randomUUID(), semantic, `[deleted] ${current.icon}`, auth.login, new Date().toISOString())
    .run();

  return jsonResponse({ ok: true });
};
