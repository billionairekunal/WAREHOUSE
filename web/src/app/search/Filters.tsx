"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, X, LayoutGrid } from "lucide-react";
import { MICRO_MARKETS, STORAGE_TYPES } from "@/lib/data";

const SORTS = [
  ["relevance", "Recommended"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
  ["area_desc", "Largest area"],
  ["newest", "Newest"],
];

export function Filters({ count }: { count: number }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  const set = (patch: Record<string, string | null>) => {
    const q = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v) q.set(k, v);
      else q.delete(k);
    }
    router.push(`/search?${q}`, { scroll: false });
  };
  const type = sp.get("type");
  const advancedCount = ["market", "area", "max_rent", "min_height", "min_docks", "midc", "verified", "from"].filter((k) => sp.get(k)).length;

  return (
    <div className="space-y-4">
      <div className="fade-x no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <button onClick={() => setOpen(true)} className="chip shrink-0 !border-navy/20">
          <SlidersHorizontal className="size-4" /> Filters
          {advancedCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-brand text-[11px] text-white">{advancedCount}</span>}
        </button>
        <span className="my-1 w-px shrink-0 bg-line" aria-hidden />
        <button className="chip" data-active={!type} onClick={() => set({ type: null })}><LayoutGrid className="size-4" /> All</button>
        <button className="chip" data-active={sp.get("flex") === "1"} onClick={() => set({ flex: sp.get("flex") ? null : "1" })}>⚡ Flex / short-term</button>
        {STORAGE_TYPES.map(({ name, icon: Icon }) => (
          <button key={name} className="chip" data-active={type === name} onClick={() => set({ type: type === name ? null : name })}>
            <Icon className="size-4" /> {name}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted"><b className="text-ink">{count}</b> {count === 1 ? "space" : "spaces"} found</p>
        <label className="flex items-center gap-2 text-sm">
          <span className="hidden text-muted sm:inline">Sort</span>
          <select value={sp.get("sort") ?? "relevance"} onChange={(e) => set({ sort: e.target.value === "relevance" ? null : e.target.value })}
            className="rounded-full border border-line bg-white px-3 py-2 font-semibold outline-none focus:border-sky">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-navy/40 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const patch: Record<string, string | null> = {};
              for (const k of ["market", "area", "max_rent", "min_height", "min_docks", "from"]) patch[k] = (fd.get(k) as string) || null;
              patch.midc = fd.get("midc") ? "1" : null;
              patch.verified = fd.get("verified") ? "1" : null;
              set(patch);
              setOpen(false);
            }}
            className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] bg-white p-6 shadow-[var(--shadow-lift)] sm:rounded-[2rem]"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold">Filters</h2>
              <button type="button" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-full hover:bg-surface" aria-label="Close filters"><X className="size-5" /></button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="label">Micro-market</span>
                <select name="market" defaultValue={sp.get("market") ?? ""} className="field">
                  <option value="">Anywhere in Pune</option>
                  {MICRO_MARKETS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </label>
              <label><span className="label">Min. area needed (sq ft)</span>
                <input name="area" type="number" min={0} step={500} defaultValue={sp.get("area") ?? ""} placeholder="e.g. 20000" className="field" /></label>
              <label><span className="label">Max. rent (₹/sq ft/mo)</span>
                <input name="max_rent" type="number" min={0} defaultValue={sp.get("max_rent") ?? ""} placeholder="e.g. 28" className="field" /></label>
              <label><span className="label">Min. clear height (m)</span>
                <input name="min_height" type="number" min={0} step={0.5} defaultValue={sp.get("min_height") ?? ""} placeholder="e.g. 10" className="field" /></label>
              <label><span className="label">Min. docks</span>
                <input name="min_docks" type="number" min={0} defaultValue={sp.get("min_docks") ?? ""} placeholder="e.g. 4" className="field" /></label>
              <label className="sm:col-span-2"><span className="label">Available by</span>
                <input name="from" type="date" defaultValue={sp.get("from") ?? ""} className="field" /></label>
              <label className="flex items-center gap-3 rounded-2xl border border-line p-4">
                <input type="checkbox" name="midc" defaultChecked={sp.get("midc") === "1"} className="size-5 accent-brand" /> <span className="text-sm font-semibold">Inside MIDC zone</span></label>
              <label className="flex items-center gap-3 rounded-2xl border border-line p-4">
                <input type="checkbox" name="verified" defaultChecked={sp.get("verified") === "1"} className="size-5 accent-brand" /> <span className="text-sm font-semibold">Verified only</span></label>
            </div>
            <div className="mt-6 flex justify-between gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => { router.push("/search"); setOpen(false); }}>Clear all</button>
              <button className="btn btn-primary">Show results</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
