import { jsonResponse, clampSortOrder, normalizeSemantic } from "../lib/utils";
import type { Env } from "../lib/types";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const semantic = url.searchParams.get("semantic");
  const icon = url.searchParams.get("icon");
  const sort = url.searchParams.get("sort") === "icon" ? "icon" : "semantic";
  const order = clampSortOrder(url.searchParams.get("order"), "asc");

  const semanticFilter = semantic ? `%${normalizeSemantic(semantic)}%` : "%";
  const iconFilter = icon ? `%${icon.trim()}%` : "%";

  const stmt = env.DB.prepare(
    `SELECT semantic, icon FROM collection1 WHERE semantic LIKE ? AND icon LIKE ? ORDER BY ${sort} ${order}`
  ).bind(semanticFilter, iconFilter);

  const { results } = await stmt.all();
  return jsonResponse({ items: results ?? [] });
};
