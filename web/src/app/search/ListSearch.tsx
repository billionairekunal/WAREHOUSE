"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { Search, X } from "lucide-react";
import { MICRO_MARKETS, STORAGE_TYPES } from "@/lib/data";

/** Free-text search above the results. Keeps every other filter; replaces the old location-only filter. */
export function ListSearch() {
  const router = useRouter();
  const sp = useSearchParams();
  const input = useRef<HTMLInputElement>(null);
  const current = sp.get("q") ?? sp.get("market") ?? "";

  const go = (text: string) => {
    const q = new URLSearchParams(sp);
    q.delete("market");
    if (text.trim()) q.set("q", text.trim());
    else q.delete("q");
    router.push(`/search?${q}`, { scroll: false });
  };

  return (
    <form role="search" onSubmit={(e) => { e.preventDefault(); go(input.current?.value ?? ""); }}
      className="flex items-center gap-2 rounded-full border border-line bg-white p-1.5 pl-5 shadow-[var(--shadow-soft)] transition focus-within:border-sky focus-within:ring-4 focus-within:ring-sky/15">
      <Search className="size-5 shrink-0 text-muted" />
      <input ref={input} key={current} defaultValue={current} name="q" list="list-suggest" autoComplete="off"
        aria-label="Search warehouses" placeholder="Search by location, warehouse name or storage type…"
        className="min-w-0 flex-1 bg-transparent py-2 text-[15px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-muted" />
      <datalist id="list-suggest">
        {MICRO_MARKETS.map((m) => <option key={m} value={m} />)}
        {STORAGE_TYPES.map((t) => <option key={t.name} value={t.name} />)}
      </datalist>
      {current && (
        <button type="button" onClick={() => go("")} aria-label="Clear search"
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface hover:text-ink">
          <X className="size-4" />
        </button>
      )}
      <button className="btn btn-primary shrink-0 !px-5 !py-2.5"><Search className="size-4" /><span className="hidden sm:inline">Search</span></button>
    </form>
  );
}
