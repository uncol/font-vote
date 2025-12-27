export function parseAllowlist(raw: string | undefined | null) {
  if (!raw) return new Set<string>();
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdmin(login: string | null | undefined, allowlist: Set<string>) {
  if (!login) return false;
  return allowlist.has(login.toLowerCase());
}
