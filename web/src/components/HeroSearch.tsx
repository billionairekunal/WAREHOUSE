"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarDays, Check, ChevronDown, Layers, MapPin, Ruler, Search, Sparkles, X } from "lucide-react";
import { MICRO_MARKETS, STORAGE_TYPES } from "@/lib/data";
import { MobileSearch } from "./MobileSearch";
import { Calendar, addDays, prettyDate } from "./Calendar";
import { buildSearchUrl, type SearchBase } from "@/lib/searchParams";
import { useT } from "@/lib/i18n/client";
import { DATE_LOCALE, TYPE_KEY, type Key } from "@/lib/i18n";

const QUICK = ["Chakan", "Talegaon", "Bhosari", "Ranjangaon", "Mahalunge"];
const SIZES = [2000, 5000, 10000, 25000, 50000, 100000];
const WHEN: [Key, number | null][] = [["s.immediately", 0], ["s.in1", 30], ["s.in3", 90], ["s.anyTime", null]];
const k = (n: number) => (n >= 1000 ? `${n / 1000}K` : String(n));

type Panel = "where" | "type" | "size" | "when" | null;

/**
 * Main search. Fields chosen from what tenants decide on first (and what leading marketplaces ask):
 * 1. Lease vs Flex  2. Where  3. What kind of storage  4. How much space  5. When they need it.
 * Every field opens a custom panel in the site's style (no browser-default dropdowns or date pickers).
 */
export function HeroSearch({ count, base, note }: { count: number; base?: SearchBase; note?: string }) {
  const router = useRouter();
  const { t, lang } = useT();
  const root = useRef<HTMLDivElement>(null);
  const whereInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState<Panel>(null);
  const [mode, setMode] = useState<"lease" | "flex">(base?.flex ? "flex" : "lease");
  const [place, setPlace] = useState(base?.q ?? base?.market ?? "");
  const [type, setType] = useState(base?.type ?? "");
  const [area, setArea] = useState(base?.area ?? "");
  const [from, setFrom] = useState(base?.from ?? "");
  const [active, setActive] = useState(0);

  // close panels on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(null); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const matches = (place.trim()
    ? MICRO_MARKETS.filter((m) => m.toLowerCase().includes(place.trim().toLowerCase()))
    : MICRO_MARKETS).slice(0, 7);
  const typeInfo = STORAGE_TYPES.find((t) => t.name === type);
  const submit = () => {
    setOpen(null);
    router.push(buildSearchUrl(base, { q: place, type, area, from, flex: mode === "flex" }), { scroll: false });
  };
  const pickPlace = (m: string) => { setPlace(m); setOpen("type"); };

  return (
    <>
    <MobileSearch count={count} base={base} />
    <div className="hidden sm:block" ref={root}>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}
        className="relative z-30 flex flex-col gap-2 rounded-[1.75rem] bg-white p-2 shadow-[0_24px_60px_-28px_rgb(3_25_91/0.45)] ring-1 ring-black/5 xl:flex-row xl:items-center xl:rounded-full">
        {/* 1. Lease / Flex */}
        <div role="tablist" aria-label={t("s.whatNeed")} className="grid shrink-0 grid-cols-2 gap-1 rounded-full bg-surface p-1 text-sm font-bold">
          {([["lease", t("s.lease")], ["flex", t("s.flex")]] as const).map(([v, label]) => (
            <button key={v} type="button" role="tab" aria-selected={mode === v} onClick={() => setMode(v)}
              title={v === "lease" ? t("s.leaseTitle") : t("s.flexTitle")}
              className={`rounded-full px-5 py-2.5 transition ${mode === v ? "bg-navy text-white shadow" : "text-muted hover:text-ink"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-1 gap-1 sm:grid-cols-3 xl:flex xl:items-center">
          {/* 2. Where */}
          <Field icon={MapPin} tint="bg-brand/10 text-brand" label={t("s.location")} active={open === "where"} className="sm:col-span-3 xl:flex-[1.3]"
            onActivate={() => { setOpen("where"); whereInput.current?.focus(); }}>
            <input ref={whereInput} value={place} autoComplete="off"
              role="combobox" aria-expanded={open === "where"} aria-controls="where-list" aria-autocomplete="list"
              onFocus={() => setOpen("where")}
              onChange={(e) => { setPlace(e.target.value); setActive(0); setOpen("where"); }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setOpen("where"); setActive((a) => Math.min(a + 1, matches.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                if (e.key === "Enter" && open === "where" && matches[active]) { e.preventDefault(); pickPlace(matches[active]); }
              }}
              placeholder={t("s.placeholder")}
              className="w-full bg-transparent text-[15px] font-bold text-ink outline-none placeholder:font-semibold placeholder:text-muted/60" />
            {place && (
              <button type="button" onClick={(e) => { e.stopPropagation(); setPlace(""); whereInput.current?.focus(); }} aria-label={t("s.clearLocation")}
                className="grid size-7 shrink-0 place-items-center rounded-full text-muted hover:bg-line"><X className="size-3.5" /></button>
            )}
            {open === "where" && (
              <Pop className="w-[min(24rem,90vw)]">
                <p className="px-3 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wider text-muted">{place.trim() ? t("s.matching") : t("s.popularAreas")}</p>
                <ul id="where-list" role="listbox">
                  {matches.map((m, i) => (
                    <li key={m} role="option" aria-selected={i === active}>
                      <button type="button" onMouseEnter={() => setActive(i)} onClick={() => pickPlace(m)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${i === active ? "bg-surface" : ""}`}>
                        <span className="tile-icon size-9 bg-brand/10 text-brand"><MapPin className="size-4" /></span>
                        <span className="flex-1"><b className="block text-sm">{m}</b><span className="text-xs text-muted">{t("s.region")}</span></span>
                        {place === m && <Check className="size-4 text-brand" />}
                      </button>
                    </li>
                  ))}
                  {!matches.length && (
                    <li><button type="button" onClick={() => setOpen("type")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface">
                      <span className="tile-icon size-9 bg-surface text-muted"><Search className="size-4" /></span>
                      <span className="text-sm">{t("s.searchFor", { q: place })}</span>
                    </button></li>
                  )}
                </ul>
              </Pop>
            )}
          </Field>

          <Divider />
          {/* 3. What */}
          <Field icon={Layers} tint="bg-amber/15 text-amber" label={t("s.type")} button active={open === "type"} onActivate={() => setOpen(open === "type" ? null : "type")}>
            <span className="flex items-center justify-between gap-1">
              <span className="truncate text-[15px] font-bold text-ink">{typeInfo ? t(TYPE_KEY[typeInfo.name]) : t("s.anyType")}</span>
              <ChevronDown className={`size-4 shrink-0 text-muted transition ${open === "type" ? "rotate-180" : ""}`} />
            </span>
            {open === "type" && (
              <Pop className="w-[min(30rem,90vw)]">
                <p className="px-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted">{t("s.whatStore")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {[{ name: "", short: "Any type", icon: Sparkles, tint: "bg-navy/10 text-navy" }, ...STORAGE_TYPES].map((ty) => {
                    const on = type === ty.name;
                    return (
                      <button key={ty.short} type="button" aria-pressed={on} onClick={() => { setType(ty.name); setOpen("size"); }}
                        className={`flex items-center gap-2.5 rounded-2xl border-2 p-2.5 text-left transition ${on ? "border-navy bg-navy/5" : "border-transparent hover:bg-surface"}`}>
                        <span className={`tile-icon size-9 shrink-0 ${ty.tint}`}><ty.icon className="size-4" /></span>
                        <span className="text-[13px] font-bold leading-tight">{ty.name ? t(TYPE_KEY[ty.name]) : t("type.any")}</span>
                      </button>
                    );
                  })}
                </div>
              </Pop>
            )}
          </Field>

          <Divider />
          {/* 4. How much */}
          <Field icon={Ruler} tint="bg-coral/10 text-coral" label={t("s.space")} active={open === "size"} onActivate={() => setOpen("size")}>
            <input type="number" min={100} step={100} inputMode="numeric" value={area}
              onFocus={() => setOpen("size")} onChange={(e) => setArea(e.target.value)}
              placeholder={mode === "flex" ? "2,000" : "20,000"}
              className="w-full bg-transparent text-[15px] font-bold text-ink outline-none [appearance:textfield] placeholder:font-semibold placeholder:text-muted/60 [&::-webkit-inner-spin-button]:appearance-none" />
            {open === "size" && (
              <Pop className="w-72">
                <p className="px-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted">{t("s.atLeast")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {SIZES.map((s) => {
                    const on = Number(area) === s;
                    return (
                      <button key={s} type="button" aria-pressed={on} onClick={() => { setArea(String(s)); setOpen("when"); }}
                        className={`rounded-full border-2 py-2 text-sm font-bold transition ${on ? "border-navy bg-navy text-white" : "border-line hover:border-sky"}`}>
                        {k(s)}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 px-1 text-xs text-muted">{t("s.exactHint")}</p>
                {area && <button type="button" onClick={() => setArea("")} className="mt-2 px-1 text-xs font-bold text-brand">{t("s.clearSize")}</button>}
              </Pop>
            )}
          </Field>

          <Divider />
          {/* 5. When */}
          <Field icon={CalendarDays} tint="bg-mint/10 text-mint" label={t("s.moveIn")} button active={open === "when"} className="xl:flex-[1.15]"
            onActivate={() => setOpen(open === "when" ? null : "when")}>
            <span className="flex items-center justify-between gap-1">
              <span className={`truncate text-[15px] font-bold ${from ? "text-ink" : "text-muted/60"}`}>{from ? prettyDate(from, DATE_LOCALE[lang]) : t("s.anyTime")}</span>
              <ChevronDown className={`size-4 shrink-0 text-muted transition ${open === "when" ? "rotate-180" : ""}`} />
            </span>
            {open === "when" && (
              <Pop className="w-80" align="right">
                <div className="grid grid-cols-2 gap-2">
                  {WHEN.map(([key, days]) => {
                    const v = days == null ? "" : addDays(days);
                    const on = from === v && (days != null || !from);
                    return (
                      <button key={key} type="button" aria-pressed={on} onClick={() => { setFrom(v); setOpen(null); }}
                        className={`rounded-full border-2 py-2 text-sm font-bold transition ${on ? "border-navy bg-navy text-white" : "border-line hover:border-sky"}`}>
                        {t(key)}
                      </button>
                    );
                  })}
                </div>
                <div className="my-3 h-px bg-line" />
                <Calendar value={from} onChange={(v) => { setFrom(v); setOpen(null); }} />
              </Pop>
            )}
          </Field>
        </div>

        <button className="btn btn-primary btn-arrow shrink-0 !justify-between !py-2 !pl-6 text-base xl:!justify-center">
          <span className="flex items-center gap-2"><Search className="size-4" /> {t("s.search")}</span>
          <span className="bubble"><ArrowRight className="size-4" /></span>
        </button>
      </form>

      {/* Popular locations */}
      <div className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto px-1 text-sm">
        <span className="shrink-0 font-semibold text-muted">{t("s.popular")}</span>
        {QUICK.map((m) => (
          <button key={m} type="button" onClick={() => setPlace(m)}
            className={`shrink-0 rounded-full px-3 py-1.5 font-bold transition ${place === m ? "bg-lime text-ink" : "bg-white text-muted ring-1 ring-line hover:text-ink"}`}>
            {m}
          </button>
        ))}
        <span className="ml-auto hidden shrink-0 font-semibold text-muted sm:block">
          {note ?? (mode === "flex" ? t("s.flexNote") : t("s.liveCount", { n: count }))}
        </span>
      </div>
    </div>
    </>
  );
}

/** One field of the bar. Clicking anywhere on it opens its panel. */
function Field({ icon: Icon, tint, label, active, onActivate, button, className = "", children }: {
  icon: typeof MapPin; tint: string; label: string; active: boolean; onActivate: () => void; button?: boolean; className?: string; children: React.ReactNode;
}) {
  return (
    <div onClick={onActivate}
      {...(button ? {
        role: "button", tabIndex: 0, "aria-haspopup": "dialog" as const, "aria-expanded": active, "aria-label": label,
        onKeyDown: (e: React.KeyboardEvent) => { if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) { e.preventDefault(); onActivate(); } },
      } : {})}
      className={`relative flex min-w-0 cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 outline-none transition focus-visible:ring-2 focus-visible:ring-sky xl:flex-1 xl:gap-2.5 xl:rounded-full xl:px-2.5 ${
        active ? "bg-surface ring-2 ring-sky/40" : "hover:bg-surface"} ${className}`}>
      <span className={`tile-icon size-10 shrink-0 xl:size-9 ${tint}`}><Icon className="size-[18px]" /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold text-muted">{label}</span>
        <span className="flex items-center gap-1">{children}</span>
      </span>
    </div>
  );
}

/** Floating panel under a field, in the site's card style. */
function Pop({ children, className = "", align = "left" }: { children: React.ReactNode; className?: string; align?: "left" | "right" }) {
  return (
    <div onClick={(e) => e.stopPropagation()} role="dialog"
      className={`sheet-in absolute top-full z-50 mt-3 cursor-default rounded-[1.5rem] bg-white p-3 text-ink shadow-[0_30px_70px_-25px_rgb(3_25_91/0.5)] ring-1 ring-line ${align === "right" ? "right-0" : "left-0"} ${className}`}>
      {children}
    </div>
  );
}

const Divider = () => <span aria-hidden className="mx-0.5 hidden h-10 w-px shrink-0 bg-line xl:block" />;
