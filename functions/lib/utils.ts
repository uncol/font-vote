export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export function jsonResponse(body: JsonValue, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { ...init, headers });
}

export function badRequest(message: string) {
  return jsonResponse({ error: message }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return jsonResponse({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return jsonResponse({ error: message }, { status: 403 });
}

export function notFound(message = "Not found") {
  return jsonResponse({ error: message }, { status: 404 });
}

export function conflict(message: string) {
  return jsonResponse({ error: message }, { status: 409 });
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export function clampSortOrder(order: string | null, fallback: "asc" | "desc") {
  if (order === "asc" || order === "desc") return order;
  return fallback;
}

export function normalizeSemantic(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeIcon(value: string) {
  return value.trim();
}

export function isNonEmpty(value: string) {
  return value.trim().length > 0;
}
