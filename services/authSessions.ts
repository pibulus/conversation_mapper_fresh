const SESSION_TTL_MS = Number(
  Deno.env.get("API_SESSION_TTL_MS") ?? `${4 * 60 * 60 * 1000}`,
);

const sessions = new Map<string, number>();

export function createSession(): string {
  cleanupExpired();
  const id = crypto.randomUUID();
  sessions.set(id, Date.now() + SESSION_TTL_MS);
  return id;
}

export function validateSession(id: string | undefined | null): boolean {
  if (!id) return false;
  const expiry = sessions.get(id);
  if (!expiry) return false;
  if (expiry < Date.now()) {
    sessions.delete(id);
    return false;
  }
  return true;
}

export function deleteSession(id: string | undefined | null) {
  if (!id) return;
  sessions.delete(id);
}

function cleanupExpired() {
  const now = Date.now();
  for (const [id, expiry] of sessions.entries()) {
    if (expiry < now) {
      sessions.delete(id);
    }
  }
}
