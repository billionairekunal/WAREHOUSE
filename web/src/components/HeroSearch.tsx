"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Building2, ChevronDown, Layers, MapPin, Ruler, Zap } from "lucide-react";
import { MICRO_MARKETS, STORAGE_TYPES } from "@/lib/data";

const QUICK = ["Chakan", "Talegaon", "Bhosari", "Ranjangaon"];

/** Hero search: Lease / Flex tabs, location with quick picks, type + area, one clear search button. */
export function HeroSearch({ count }: { count: number }) {
  const router = useRouter();
  const [mode, setMode] = useState<"lease" | "flex">("lease");
  const [market, setMarket] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = new URLSearchParams();
        for (const [k, v] of new FormData(e.currentTarget)) if (v) q.set(k, String(v));
        if (mode === "flex") q.set("flex", "1");
        router.push(`/search?${q}`);
      }}
      className="rounded-[1.75rem] bg-white p-3 shadow-[0_30px_70px_-25px_rgb(3_25_91/0.45)] ring-1 ring-black/5 sm:p-4"
    >
      {/* Lease / Flex tabs */}
      <div role="tablist" aria-label="Search type" className="grid grid-cols-2 gap-1 rounded-full bg-surface p-1 text-sm font-bold">
        {([["lease", Building2, "Long-term lease"], ["flex", Zap, "Flex storage"]] as const).map(([v, Icon, label]) => (
          <button key={v} type="button" role="tab" aria-selected={mode === v} onClick={() => setMode(v)}
            className={`flex items-center justify-center gap-1.5 rounded-full py-2.5 transition ${mode === v ? "bg-navy text-white shadow" : "text-muted hover:text-ink"}`}>
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      {/* Location */}
      <label className="mt-3 flex items-center gap-3 rounded-2xl border border-line px-4 py-3 transition focus-within:border-sky focus-within:ring-4 focus-within:ring-sky/15">
        <span className="tile-icon size-10 shrink-0 bg-brand/10 text-brand"><MapPin className="size-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-muted">Location</span>
          <input name="market" list="hero-markets" value={market} onChange={(e) => setMarket(e.target.value)}
            placeholder="Where do you need space?" autoComplete="off"
            className="w-full bg-transparent text-base font-bold text-ink outline-none placeholder:font-semibold placeholder:text-muted/60" />
          <datalist id="hero-markets">{MICRO_MARKETS.map((m) => <option key={m} value={m} />)}</datalist>
        </span>
      </label>
      <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto px-1">
        {QUICK.map((m) => (
          <button key={m} type="button" onClick={() => setMarket(m)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${market === m ? "bg-lime text-ink" : "bg-surface text-muted hover:text-ink"}`}>
            {m}
          </button>
        ))}
      </div>

      {/* Type + area */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="relative flex items-center gap-2.5 rounded-2xl border border-line px-3 py-2.5 focus-within:border-sky">
          <Layers className="size-5 shrink-0 text-amber" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-muted">Storage type</span>
            <select name="type" defaultValue="" className="w-full appearance-none bg-transparent pr-5 text-sm font-bold text-ink outline-none">
              <option value="">Any type</option>
              {STORAGE_TYPES.map((t) => <option key={t.name} value={t.name}>{t.short}</option>)}
            </select>
          </span>
          <ChevronDown className="pointer-events-none absolute right-3 size-4 text-muted" />
        </label>
        <label className="flex items-center gap-2.5 rounded-2xl border border-line px-3 py-2.5 focus-within:border-sky">
          <Ruler className="size-5 shrink-0 text-coral" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-muted">Min. area (sq ft)</span>
            <input name="area" type="number" min={500} step={500} inputMode="numeric" placeholder="20,000"
              className="w-full bg-transparent text-sm font-bold text-ink outline-none placeholder:font-semibold placeholder:text-muted/60" />
          </span>
        </label>
      </div>

      <button className="btn btn-primary btn-arrow mt-3 w-full !justify-between !py-2 !pl-6 text-base">
        {mode === "flex" ? "Find flex storage" : `Search ${count} verified spaces`}
        <span className="bubble"><ArrowRight className="size-4" /></span>
      </button>
    </form>
  );
}
