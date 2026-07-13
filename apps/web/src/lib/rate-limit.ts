// Minimal per-instance sliding-window limiter. Serverless instances each get
// their own window, which is acceptable protection for Release 1's paid AI
// endpoint; move to a shared store if abuse becomes a real concern.
const windows = new Map<string, number[]>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (windows.get(key) || []).filter(t => now - t < windowMs);
  if (hits.length >= limit) {
    windows.set(key, hits);
    return false;
  }
  hits.push(now);
  windows.set(key, hits);
  return true;
}
