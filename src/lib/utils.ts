import type { Response } from 'express';

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export function jsonResponse(res: Response, body: JsonValue, status: number = 200) {
  res.status(status).json(body);
}

export function badRequest(res: Response, message: string) {
  jsonResponse(res, { error: message }, 400);
}

export function unauthorized(res: Response, message = "Unauthorized") {
  jsonResponse(res, { error: message }, 401);
}

export function forbidden(res: Response, message = "Forbidden") {
  jsonResponse(res, { error: message }, 403);
}

export function notFound(res: Response, message = "Not found") {
  jsonResponse(res, { error: message }, 404);
}

export function conflict(res: Response, message: string) {
  jsonResponse(res, { error: message }, 409);
}

export function clampSortOrder(order: string | null | undefined, fallback: "asc" | "desc") {
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
