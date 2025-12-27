import { badRequest, conflict, forbidden, jsonResponse, notFound, readJson, unauthorized } from "../../lib/utils";
import { readSessionCookie } from "../../lib/auth";
import { parseAllowlist, isAdmin } from "../../lib/admin";
import type { Env } from "../../lib/types";

type Payload = {
  id?: string;
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
  if (!body?.id) return badRequest("id is required");

  const entry = await env.DB.prepare("SELECT id, semantic, icon, applied FROM journal WHERE id = ?")
    .bind(body.id)
    .first();
  if (!entry) return notFound("journal entry not found");
  if (entry.applied) return conflict("journal entry already applied");

  const semanticRow = await env.DB.prepare("SELECT semantic FROM collection1 WHERE semantic = ?")
    .bind(entry.semantic)
    .first();
  if (!semanticRow) return conflict("semantic does not exist");

  const newId = crypto.randomUUID();
  const created = new Date().toISOString();

  const statements = [
    env.DB.prepare(
      "UPDATE collection1 SET icon = ? WHERE semantic = ? AND EXISTS (SELECT 1 FROM journal WHERE id = ? AND applied = 0)"
    ).bind(entry.icon, entry.semantic, entry.id),
    env.DB.prepare(
      "INSERT INTO journal (id, semantic, icon, user, created, applied) SELECT ?, ?, ?, ?, ?, 0 WHERE EXISTS (SELECT 1 FROM journal WHERE id = ? AND applied = 0)"
    ).bind(newId, entry.semantic, entry.icon, auth.login, created, entry.id),
    env.DB.prepare("UPDATE journal SET applied = 1 WHERE id = ? AND applied = 0").bind(entry.id),
  ];

  const results = await env.DB.batch(statements);
  const appliedResult = results[2];
  if (!appliedResult.success || appliedResult.changes === 0) {
    return conflict("journal entry already applied");
  }

  return jsonResponse({ ok: true });
};
