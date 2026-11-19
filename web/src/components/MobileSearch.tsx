"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Check, LayoutGrid, MapPin, Ruler, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { MICRO_MARKETS, STORAGE_TYPES } from "@/lib/data";
import { buildSearchUrl, type SearchBase } from "@/lib/searchParams";

const POPULAR = ["Chakan", "Talegaon", "Bhosari", "Ranjangaon", "Mahalunge"];
const SIZES = [2000, 5000, 10000, 25000, 50000];
const WHEN: [string, number | null][] = [["Immediately", 0], ["Within 1 month", 30], ["Within 3 months", 90], ["Flexible", null]];

type Step = "where" | "what" | "size" | "when";
const fmt = (n: number) => (n >= 1000 ? `${n / 1000}K` : String(n));
const inDays = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);

/** Phone search: a compact pill that opens a full-screen, step-by-step search sheet (Airbnb-style). */
export function MobileSearch({ count, base }: { count: number; base?: SearchBase }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("where");
  const [mode, setMode] = useState<"lease" | "flex">(base?.flex ? "flex" : "lease");
  const [place, setPlace] = useState(base?.q ?? base?.market ?? "");
  const [type, setType] = useState(base?.type ?? "");
  const [area, setArea] = useState<number | "">(base?.area ? Number(base.area) || "" : "");
  const [when, setWhen] = useState<{ label: string; date: string }>(base?.from
    ? { label: new Date(base.from).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), date: base.from }
    : { label: "", date: "" });

  // lock page scroll and support the Escape key while the sheet is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [open]);

  const go = (overridePlace?: string) => {
    setOpen(false);
    router.push(buildSearchUrl(base, { q: overridePlace ?? place, type, area: area || undefined, from: when.date, flex: mode === "flex" }), { scroll: false });
  };
  const clear = () => { setPlace(""); setType(""); setArea(""); setWhen({ label: "", date: "" }); setStep("where"); };
  const typeShort = STORAGE_TYPES.find((t) => t.name === type)?.short;
  const summary = [typeShort ?? "Any type", area ? `${fmt(area)}+ sq ft` : "Any size", when.label || "Any time"].join(" · ");

  return (
    <div className="sm:hidden">
      {/* ---------- Compact pill ---------- */}
      <button type="button" onClick={() => { setStep("where"); setOpen(true); }}
        className="flex w-full items-center gap-3 rounded-full bg-white p-2 pl-3 text-left shadow-[0_18px_40px_-18px_rgb(3_25_91/0.45)] ring-1 ring-black/5 active:scale-[0.99]">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky to-royal text-white"><Search className="size-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-extrabold">{place || "Where do you need space?"}</span>
          <span className="block truncate text-xs font-semibold text-muted">{mode === "flex" ? "Flex · " : ""}{summary}</span>
        </span>
        <span className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-ink"><SlidersHorizontal className="size-[18px]" /></span>
      </button>
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
        {POPULAR.map((m) => (
          <button key={m} type="button" onClick={() => { setPlace(m); go(m); }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-bold text-ink ring-1 ring-line active:bg-lime">
            <MapPin className="size-3.5 text-brand" /> {m}
          </button>
        ))}
      </div>

      {/* ---------- Full-screen sheet ---------- */}
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Search warehouses" className="sheet-in fixed inset-0 z-[70] flex flex-col bg-bg">
          <div className="flex items-center justify-between px-4 pb-3 pt-4">
            <button type="button" onClick={() => setOpen(false)} aria-label="Close search" className="grid size-10 place-items-center rounded-full bg-white shadow-sm ring-1 ring-line"><ArrowLeft className="size-5" /></button>
            <div role="tablist" aria-label="What do you need?" className="grid grid-cols-2 gap-1 rounded-full bg-white p-1 text-sm font-bold ring-1 ring-line">
              {([["lease", "Lease"], ["flex", "Flex storage"]] as const).map(([v, label]) => (
                <button key={v} type="button" role="tab" aria-selected={mode === v} onClick={() => setMode(v)}
                  className={`rounded-full px-4 py-2 transition ${mode === v ? "bg-navy text-white" : "text-muted"}`}>{label}</button>
              ))}
            </div>
            <span className="size-10" />
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-6">
            {/* WHERE */}
            <Section open={step === "where"} onOpen={() => setStep("where")} title="Where?" value={place || "Anywhere in Pune"} icon={MapPin} tint="bg-brand/10 text-brand">
              <label className="flex items-center gap-3 rounded-2xl border-2 border-line bg-surface px-4 py-3.5 focus-within:border-sky focus-within:bg-white">
                <Search className="size-5 text-muted" />
                <input autoFocus value={place} onChange={(e) => setPlace(e.target.value)} enterKeyHint="next"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setStep("what"); } }}
                  placeholder="Area, MIDC or warehouse name" className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-muted" />
                {place && <button type="button" onClick={() => setPlace("")} aria-label="Clear location"><X className="size-4 text-muted" /></button>}
              </label>
              <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-muted">Popular in Pune</p>
              <ul className="divide-y divide-line">
                {(place ? MICRO_MARKETS.filter((m) => m.toLowerCase().includes(place.toLowerCase())) : MICRO_MARKETS.slice(0, 6)).slice(0, 6).map((m) => (
                  <li key={m}>
                    <button type="button" onClick={() => { setPlace(m); setStep("what"); }} className="flex w-full items-center gap-3 py-3 text-left">
                      <span className="tile-icon size-10 bg-surface text-navy"><MapPin className="size-[18px]" /></span>
                      <span className="flex-1 font-semibold">{m}</span>
                      {place === m && <Check className="size-5 text-brand" />}
                    </button>
                  </li>
                ))}
              </ul>
            </Section>

            {/* WHAT */}
            <Section open={step === "what"} onOpen={() => setStep("what")} title="What kind of storage?" value={typeShort ?? "Any type"} icon={LayoutGrid} tint="bg-amber/15 text-amber">
              <div className="grid grid-cols-3 gap-2">
                <TypeTile active={!type} onClick={() => { setType(""); setStep("size"); }} icon={Sparkles} tint="bg-navy/10 text-navy" label="Any type" />
                {STORAGE_TYPES.map((t) => (
                  <TypeTile key={t.name} active={type === t.name} onClick={() => { setType(t.name); setStep("size"); }} icon={t.icon} tint={t.tint} label={t.short} />
                ))}
              </div>
            </Section>

            {/* SIZE */}
            <Section open={step === "size"} onOpen={() => setStep("size")} title="How much space?" value={area ? `${area.toLocaleString("en-IN")}+ sq ft` : "Any size"} icon={Ruler} tint="bg-coral/10 text-coral">
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => (
                  <Chip key={s} active={area === s} onClick={() => { setArea(area === s ? "" : s); }}>{fmt(s)}+ sq ft</Chip>
                ))}
              </div>
              <label className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-line bg-surface px-4 py-3 focus-within:border-sky focus-within:bg-white">
                <span className="text-sm font-semibold text-muted">Exact</span>
                <input type="number" inputMode="numeric" min={100} step={100} value={area} placeholder="e.g. 12,000"
                  onChange={(e) => setArea(e.target.value ? Number(e.target.value) : "")}
                  className="min-w-0 flex-1 bg-transparent text-right text-base font-bold outline-none placeholder:font-medium placeholder:text-muted" />
                <span className="text-sm font-semibold text-muted">sq ft</span>
              </label>
              <button type="button" onClick={() => setStep("when")} className="mt-3 w-full rounded-full py-2 text-sm font-bold text-brand">Next: move-in date →</button>
            </Section>

            {/* WHEN */}
            <Section open={step === "when"} onOpen={() => setStep("when")} title="When do you need it?" value={when.label || "Any time"} icon={CalendarDays} tint="bg-mint/10 text-mint">
              <div className="grid grid-cols-2 gap-2">
                {WHEN.map(([label, days]) => (
                  <Chip key={label} active={when.label === label} block
                    onClick={() => setWhen(when.label === label ? { label: "", date: "" } : { label, date: days == null ? "" : inDays(days) })}>
                    {label}
                  </Chip>
                ))}
              </div>
              <label className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-line bg-surface px-4 py-3 focus-within:border-sky focus-within:bg-white">
                <CalendarDays className="size-5 text-muted" />
                <span className="text-sm font-semibold text-muted">Pick a date</span>
                <input type="date" min={inDays(0)} value={when.date && !WHEN.some(([l]) => l === when.label) ? when.date : ""}
                  onChange={(e) => setWhen(e.target.value
                    ? { label: new Date(e.target.value).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), date: e.target.value }
                    : { label: "", date: "" })}
                  className="min-w-0 flex-1 bg-transparent text-right text-base font-bold outline-none [color-scheme:light]" />
              </label>
            </Section>
          </div>

          {/* Sticky footer */}
          <div className="flex items-center justify-between gap-3 border-t border-line bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <button type="button" onClick={clear} className="px-2 py-3 text-sm font-bold text-ink underline underline-offset-4">Clear all</button>
            <button type="button" onClick={() => go()} className="btn btn-primary flex-1 !py-4 text-base">
              <Search className="size-5" /> Search {mode === "flex" ? "flex storage" : `${count} spaces`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ open, onOpen, title, value, icon: Icon, tint, children }: {
  open: boolean; onOpen: () => void; title: string; value: string; icon: typeof MapPin; tint: string; children: React.ReactNode;
}) {
  if (!open) {
    return (
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 rounded-[1.5rem] bg-white px-4 py-4 text-left shadow-sm ring-1 ring-line">
        <span className={`tile-icon size-10 shrink-0 ${tint}`}><Icon className="size-[18px]" /></span>
        <span className="flex-1 text-sm font-semibold text-muted">{title}</span>
        <span className="max-w-[45%] truncate text-sm font-extrabold">{value}</span>
      </button>
    );
  }
  return (
    <section className="rise rounded-[1.75rem] bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-line">
      <h2 className="mb-4 text-2xl font-black">{title}</h2>
      {children}
    </section>
  );
}

function TypeTile({ active, onClick, icon: Icon, tint, label }: { active: boolean; onClick: () => void; icon: typeof MapPin; tint: string; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`flex flex-col items-start gap-2 rounded-2xl border-2 p-3 text-left transition ${active ? "border-navy bg-navy/5" : "border-line bg-white"}`}>
      <span className={`tile-icon size-9 ${tint}`}><Icon className="size-[18px]" /></span>
      <span className="text-[13px] font-bold leading-tight">{label}</span>
    </button>
  );
}

function Chip({ active, onClick, block, children }: { active: boolean; onClick: () => void; block?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`rounded-full border-2 px-4 py-2.5 text-sm font-bold transition ${block ? "w-full" : ""} ${active ? "border-navy bg-navy text-white" : "border-line bg-white text-ink"}`}>
      {children}
    </button>
  );
}
