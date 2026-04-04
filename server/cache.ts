const store = new Map<string, { data: unknown; expires: number }>();

export function cacheGet(key: string): unknown | null {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.data;
  store.delete(key);
  return null;
}

export function cacheSet(key: string, data: unknown, ttlMs: number): void {
  store.set(key, { data, expires: Date.now() + ttlMs });
}
