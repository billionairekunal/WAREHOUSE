"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const pad = (n: number) => String(n).padStart(2, "0");
/** yyyy-mm-dd in local time (avoids the UTC off-by-one of toISOString). */
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
export const prettyDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/** Month calendar in the site's style. Past days are disabled. */
export function Calendar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const today = ymd(new Date());
  const start = value ? new Date(`${value}T00:00`) : new Date();
  const [view, setView] = useState({ y: start.getFullYear(), m: start.getMonth() });
  const now = new Date();
  const atFirstMonth = view.y === now.getFullYear() && view.m === now.getMonth();

  const first = new Date(view.y, view.m, 1);
  const lead = (first.getDay() + 6) % 7; // Monday-first
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const shift = (d: number) => setView(({ y, m }) => ({ y: m + d < 0 ? y - 1 : m + d > 11 ? y + 1 : y, m: (m + d + 12) % 12 }));

  return (
    <div className="select-none">
      <div className="flex items-center justify-between px-1">
        <button type="button" onClick={() => shift(-1)} disabled={atFirstMonth} aria-label="Previous month"
          className="grid size-9 place-items-center rounded-full hover:bg-surface disabled:opacity-30"><ChevronLeft className="size-4" /></button>
        <p className="text-sm font-extrabold">{first.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
        <button type="button" onClick={() => shift(1)} aria-label="Next month"
          className="grid size-9 place-items-center rounded-full hover:bg-surface"><ChevronRight className="size-4" /></button>
      </div>
      <div className="mt-2 grid grid-cols-7 text-center text-[11px] font-bold uppercase text-muted">
        {WEEK.map((w) => <span key={w} className="py-1">{w}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const v = `${view.y}-${pad(view.m + 1)}-${pad(d)}`;
          const past = v < today, sel = v === value, isToday = v === today;
          return (
            <button key={v} type="button" disabled={past} onClick={() => onChange(v)} aria-label={prettyDate(v)} aria-pressed={sel}
              className={`mx-auto grid size-9 place-items-center rounded-full text-sm font-semibold transition ${
                sel ? "bg-navy text-white shadow" : past ? "text-muted/35" : "hover:bg-ice/60"} ${isToday && !sel ? "ring-2 ring-brand/40" : ""}`}>
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
