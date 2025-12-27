import { jsonResponse, clampSortOrder, normalizeSemantic } from "../lib/utils";
import type { Env } from "../lib/types";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const semantic = url.searchParams.get("semantic");
  const user = url.searchParams.get("user");
  const order = clampSortOrder(url.searchParams.get("order"), "desc");

  const semanticFilter = semantic ? `%${normalizeSemantic(semantic)}%` : "%";
  const userFilter = user ? `%${user.trim()}%` : "%";

  const stmt = env.DB.prepare(
    `SELECT id, semantic, icon, user, created, applied FROM journal WHERE semantic LIKE ? AND user LIKE ? ORDER BY created ${order}`
  ).bind(semanticFilter, userFilter);

  const { results } = await stmt.all();
  return jsonResponse({ items: results ?? [] });
};
