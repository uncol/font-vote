import { jsonResponse } from "./utils";

export type Session = {
  login: string;
  exp: number;
};

const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const padded =
    value.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function sign(input: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(input));
  return base64UrlEncode(new Uint8Array(sig));
}

async function verify(input: string, secret: string, signature: string) {
  const expected = await sign(input, secret);
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

function serializeCookie(
  name: string,
  value: string,
  options: {
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Lax" | "Strict" | "None";
    path?: string;
  },
) {
  const parts = [`${name}=${value}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  parts.push(`Path=${options.path ?? "/"}`);
  return parts.join("; ");
}

export async function createSessionCookie(login: string, secret: string) {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const payload = base64UrlEncode(
    encoder.encode(JSON.stringify({ login, exp })),
  );
  const signature = await sign(payload, secret);
  const value = `${payload}.${signature}`;
  return serializeCookie("session", value, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
  });
}

export async function readSessionCookie(
  req: Request,
  secret: string,
): Promise<Session | null> {
  const cookie = req.headers.get("Cookie");
  if (!cookie) return null;
  const match = cookie
    .split(/;\s*/)
    .find((part) => part.startsWith("session="));
  if (!match) return null;
  const value = match.split("=").slice(1).join("=");
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const ok = await verify(payload, secret, signature);
  if (!ok) return null;
  try {
    const data = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(payload)),
    ) as Session;
    if (!data.login || !data.exp) return null;
    if (Date.now() / 1000 > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export async function createStateCookie(state: string, secret: string) {
  const exp = Math.floor(Date.now() / 1000) + 60 * 10;
  const payload = base64UrlEncode(
    encoder.encode(JSON.stringify({ state, exp })),
  );
  const signature = await sign(payload, secret);
  const value = `${payload}.${signature}`;
  return serializeCookie("oauth_state", value, {
    maxAge: 60 * 10,
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
  });
}

export async function verifyState(req: Request, state: string, secret: string) {
  const cookie = req.headers.get("Cookie");
  if (!cookie) return false;
  const match = cookie
    .split(/;\s*/)
    .find((part) => part.startsWith("oauth_state="));
  if (!match) return false;
  const value = match.split("=").slice(1).join("=");
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;
  const ok = await verify(payload, secret, signature);
  if (!ok) return false;
  try {
    const data = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(payload)),
    ) as { state: string; exp: number };
    if (Date.now() / 1000 > data.exp) return false;
    return data.state === state;
  } catch {
    return false;
  }
}

export function clearStateCookie() {
  return serializeCookie("oauth_state", "", {
    maxAge: 0,
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
  });
}

export function oauthError(message: string) {
  return jsonResponse({ error: message }, { status: 400 });
}
