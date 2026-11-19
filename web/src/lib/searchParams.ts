/** Search fields owned by the main search bar; everything else (rent, height, docks, sort...) is preserved. */
export const MAIN_KEYS = ["q", "market", "type", "area", "from", "flex"];
export type SearchBase = Record<string, string>;

export function buildSearchUrl(base: SearchBase | undefined, v: { q?: string; type?: string; area?: string | number; from?: string; flex?: boolean }) {
  const q = new URLSearchParams();
  for (const [k, val] of Object.entries(base ?? {})) if (!MAIN_KEYS.includes(k) && val) q.set(k, val);
  if (v.q?.trim()) q.set("q", v.q.trim());
  if (v.type) q.set("type", v.type);
  if (v.area) q.set("area", String(v.area));
  if (v.from) q.set("from", v.from);
  if (v.flex) q.set("flex", "1");
  return `/search?${q}`;
}
