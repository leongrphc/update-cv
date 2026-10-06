const entries = new Map<string, { count: number; expiresAt: number }>();
const WINDOW_MS = 60_000;
const MAX_ENTRIES = 10_000;
let nextCleanup = 0;

// Per-process protection. Multi-instance hosting should use a shared rate-limit store.
export function isRateLimited(key: string, limit: number): boolean {
  const now = Date.now();
  if (now >= nextCleanup) {
    entries.forEach((entry, entryKey) => {
      if (entry.expiresAt <= now) entries.delete(entryKey);
    });
    nextCleanup = now + WINDOW_MS;
  }

  const entry = entries.get(key);
  if (entry && entry.expiresAt > now) {
    entry.count += 1;
    return entry.count > limit;
  }

  if (entries.size >= MAX_ENTRIES) {
    return true;
  }
  entries.set(key, { count: 1, expiresAt: now + WINDOW_MS });
  return false;
}
