import type { Env } from "../lib/types";
import { clampSortOrder, jsonResponse, normalizeSemantic } from "../lib/utils";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const semantic = url.searchParams.get("semantic");
  const user = url.searchParams.get("user");
  const icon = url.searchParams.get("icon");
  const order = clampSortOrder(url.searchParams.get("order"), "desc");

  const semanticFilter = semantic ? `%${normalizeSemantic(semantic)}%` : "%";
  const userFilter = user ? `%${user.trim()}%` : "%";
  const iconFilter = icon ? `%${icon.trim().replace(/-/g, "_")}%` : "%";

  const stmt = env.DB.prepare(
    `SELECT journal.id,
            journal.semantic,
            journal.icon,
            journal.user,
            journal.created,
            journal.applied,
            collection1.icon AS current_icon
       FROM journal
       LEFT JOIN collection1 ON collection1.semantic = journal.semantic
      WHERE journal.semantic LIKE ?
        AND journal.user LIKE ?
        AND journal.icon LIKE ?
      ORDER BY journal.created ${order}`
  ).bind(semanticFilter, userFilter, iconFilter);

  const { results } = await stmt.all();
  return jsonResponse({ items: results ?? [] });
};
