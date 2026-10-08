const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit = 8, windowMs = 60_000) {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) return false;
  recent.push(now);
  buckets.set(key, recent);
  return true;
}

export function requestKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
