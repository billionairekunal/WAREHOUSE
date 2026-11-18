"use client";
import { useRouter } from "next/navigation";
import { CalendarDays, Layers, MapPin, Ruler, Search } from "lucide-react";
import { MICRO_MARKETS, STORAGE_TYPES } from "@/lib/data";

/** Pill search bar: location / type / area / move-in → /search */
export function SearchBar() {
  const router = useRouter();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const q = new URLSearchParams();
        for (const [k, v] of fd) if (v) q.set(k, String(v));
        router.push(`/search?${q}`);
      }}
      className="glass grid grid-cols-2 gap-1 rounded-[1.75rem] p-2 shadow-[var(--shadow-lift)] md:flex md:items-center md:rounded-full"
    >
      <Field icon={MapPin} label="Location" className="col-span-2 md:flex-[1.3]">
        <input name="market" list="markets" placeholder="Chakan, Talegaon, Bhosari…" className="w-full bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:text-muted" />
        <datalist id="markets">{MICRO_MARKETS.map((m) => <option key={m} value={m} />)}</datalist>
      </Field>
      <Field icon={Layers} label="Storage type" className="col-span-2 md:flex-1">
        <select name="type" defaultValue="" className="w-full bg-transparent text-sm font-semibold outline-none">
          <option value="">Any type</option>
          {STORAGE_TYPES.map((t) => <option key={t.name}>{t.name}</option>)}
        </select>
      </Field>
      <Field icon={Ruler} label="Area (sq ft)">
        <input name="area" type="number" min={500} step={500} placeholder="20,000" className="w-full bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:text-muted" />
      </Field>
      <Field icon={CalendarDays} label="Move-in">
        <input name="from" type="date" className="w-full bg-transparent text-sm font-semibold outline-none" />
      </Field>
      <button className="btn btn-primary col-span-2 !rounded-full !py-4 md:!size-14 md:!p-0" aria-label="Search">
        <Search className="size-5" /> <span className="md:hidden">Search spaces</span>
      </button>
    </form>
  );
}

function Field({ icon: Icon, label, children, className = "" }: { icon: typeof MapPin; label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex min-w-0 items-center gap-3 rounded-[1.25rem] px-4 py-2.5 transition hover:bg-white/80 md:rounded-full md:border-r md:border-line md:last-of-type:border-0 ${className}`}>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ice/70 text-brand"><Icon className="size-4" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold uppercase tracking-wide text-muted">{label}</span>
        {children}
      </span>
    </label>
  );
}
