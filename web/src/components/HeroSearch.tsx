"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CalendarDays, ChevronDown, Layers, MapPin, Ruler, Search } from "lucide-react";
import { MICRO_MARKETS, STORAGE_TYPES } from "@/lib/data";

const QUICK = ["Chakan", "Talegaon", "Bhosari", "Ranjangaon", "Mahalunge"];

/**
 * Home search. Fields chosen from what tenants decide on first (and what leading marketplaces ask):
 * 1. Lease vs Flex  2. Where  3. What kind of storage  4. How much space  5. When they need it.
 * Budget, height, docks etc. stay on the results page as filters.
 */
export function HeroSearch({ count }: { count: number }) {
  const router = useRouter();
  const [mode, setMode] = useState<"lease" | "flex">("lease");
  const [place, setPlace] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const q = new URLSearchParams();
          for (const [k, v] of new FormData(e.currentTarget)) if (String(v).trim()) q.set(k, String(v).trim());
          if (mode === "flex") q.set("flex", "1");
          router.push(`/search?${q}`);
        }}
        className="flex flex-col gap-2 rounded-[1.75rem] bg-white p-2 shadow-[0_24px_60px_-28px_rgb(3_25_91/0.45)] ring-1 ring-black/5 xl:flex-row xl:items-center xl:rounded-full"
      >
        {/* 1. Lease / Flex */}
        <div role="tablist" aria-label="What do you need?" className="grid shrink-0 grid-cols-2 gap-1 rounded-full bg-surface p-1 text-sm font-bold">
          {([["lease", "Lease"], ["flex", "Flex"]] as const).map(([v, label]) => (
            <button key={v} type="button" role="tab" aria-selected={mode === v} onClick={() => setMode(v)}
              title={v === "lease" ? "Long-term lease (1 year+)" : "Short-term storage, 1–6 months"}
              className={`rounded-full px-5 py-2.5 transition ${mode === v ? "bg-navy text-white shadow" : "text-muted hover:text-ink"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-1 gap-1 sm:grid-cols-3 xl:flex xl:items-center">
          {/* 2. Where */}
          <Field icon={MapPin} tint="bg-brand/10 text-brand" label="Location" className="sm:col-span-3 xl:flex-[1.3]">
            <input name="q" list="hero-markets" value={place} onChange={(e) => setPlace(e.target.value)}
              placeholder="Chakan, Talegaon, Bhosari…" autoComplete="off"
              className="w-full bg-transparent text-[15px] font-bold text-ink outline-none placeholder:font-semibold placeholder:text-muted/60" />
            <datalist id="hero-markets">{MICRO_MARKETS.map((m) => <option key={m} value={m} />)}</datalist>
          </Field>

          <Divider />
          {/* 3. What */}
          <Field icon={Layers} tint="bg-amber/15 text-amber" label="Storage type">
            <span className="relative block">
              <select name="type" defaultValue="" className="w-full appearance-none bg-transparent pr-6 text-[15px] font-bold text-ink outline-none">
                <option value="">Any type</option>
                {STORAGE_TYPES.map((t) => <option key={t.name} value={t.name}>{t.short}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-muted" />
            </span>
          </Field>

          <Divider />
          {/* 4. How much */}
          <Field icon={Ruler} tint="bg-coral/10 text-coral" label="Space needed (sq ft)">
            <input name="area" type="number" min={100} step={100} inputMode="numeric"
              placeholder={mode === "flex" ? "2,000" : "20,000"}
              className="w-full bg-transparent text-[15px] font-bold text-ink outline-none placeholder:font-semibold placeholder:text-muted/60" />
          </Field>

          <Divider />
          {/* 5. When */}
          <Field icon={CalendarDays} tint="bg-mint/10 text-mint" label="Move-in by" className="xl:flex-[1.15]">
            <input name="from" type="date" min={today} suppressHydrationWarning
              className="w-full bg-transparent text-[15px] font-bold text-ink outline-none [color-scheme:light]" />
          </Field>
        </div>

        <button className="btn btn-primary btn-arrow shrink-0 !justify-between !py-2 !pl-6 text-base xl:!justify-center">
          <span className="flex items-center gap-2"><Search className="size-4" /> Search</span>
          <span className="bubble"><ArrowRight className="size-4" /></span>
        </button>
      </form>

      {/* Popular locations */}
      <div className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto px-1 text-sm">
        <span className="shrink-0 font-semibold text-muted">Popular:</span>
        {QUICK.map((m) => (
          <button key={m} type="button" onClick={() => setPlace(m)}
            className={`shrink-0 rounded-full px-3 py-1.5 font-bold transition ${place === m ? "bg-lime text-ink" : "bg-white text-muted ring-1 ring-line hover:text-ink"}`}>
            {m}
          </button>
        ))}
        <span className="ml-auto hidden shrink-0 font-semibold text-muted sm:block">
          {mode === "flex" ? "Flex: short-term, by the pallet or sq ft" : `${count} verified spaces live`}
        </span>
      </div>
    </div>
  );
}

function Field({ icon: Icon, tint, label, className = "", children }: { icon: typeof MapPin; tint: string; label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex min-w-0 items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-surface xl:flex-1 xl:gap-2.5 xl:rounded-full xl:px-2.5 ${className}`}>
      <span className={`tile-icon size-10 shrink-0 xl:size-9 ${tint}`}><Icon className="size-[18px]" /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold text-muted">{label}</span>
        {children}
      </span>
    </label>
  );
}

const Divider = () => <span aria-hidden className="mx-0.5 hidden h-10 w-px shrink-0 bg-line xl:block" />;
