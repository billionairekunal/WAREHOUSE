"use client";
import { useRouter } from "next/navigation";
import { ArrowRight, Layers, MapPin, Ruler } from "lucide-react";
import { MICRO_MARKETS, STORAGE_TYPES } from "@/lib/data";

/** Stacked search card with a round go-button, like the car app's "Pickup location" card. */
export function HeroSearch() {
  const router = useRouter();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = new URLSearchParams();
        for (const [k, v] of new FormData(e.currentTarget)) if (v) q.set(k, String(v));
        router.push(`/search?${q}`);
      }}
      className="glass relative rounded-[1.75rem] p-2 shadow-[var(--shadow-lift)]"
    >
      <Row icon={MapPin} label="Where do you need space?">
        <input name="market" list="hero-markets" placeholder="Chakan MIDC, Talegaon…" className="w-full bg-transparent text-[15px] font-bold outline-none placeholder:font-semibold placeholder:text-muted/70" />
        <datalist id="hero-markets">{MICRO_MARKETS.map((m) => <option key={m} value={m} />)}</datalist>
      </Row>
      <div className="mx-4 h-px bg-line" />
      <div className="grid grid-cols-2">
        <Row icon={Layers} label="Storage type">
          <select name="type" defaultValue="" className="w-full bg-transparent text-[15px] font-bold outline-none">
            <option value="">Any type</option>
            {STORAGE_TYPES.map((t) => <option key={t.name} value={t.name}>{t.short}</option>)}
          </select>
        </Row>
        <Row icon={Ruler} label="Area (sq ft)">
          <input name="area" type="number" min={500} step={500} placeholder="20,000" className="w-full bg-transparent text-[15px] font-bold outline-none placeholder:font-semibold placeholder:text-muted/70" />
        </Row>
      </div>
      <button aria-label="Search spaces"
        className="absolute -right-3 top-1/2 grid size-14 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-sky to-royal text-white shadow-[var(--shadow-glow)] transition hover:scale-105 sm:-right-4 sm:size-16">
        <ArrowRight className="size-6" />
      </button>
    </form>
  );
}

function Row({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 items-center gap-3 rounded-2xl px-3 py-3 pr-12 transition hover:bg-white/70">
      <Icon className="size-5 shrink-0 text-muted" />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold text-muted">{label}</span>
        {children}
      </span>
    </label>
  );
}
