"use client";
import { useMemo, useState } from "react";
import { CalendarCheck, Sun, Sunset } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { DATE_LOCALE } from "@/lib/i18n";
import { ymd } from "@/components/Calendar";

const MORNING = ["09:00", "10:00", "11:00", "12:00"];
const AFTERNOON = ["13:00", "14:00", "15:00", "16:00", "17:00"];
const DAYS = 14;

/**
 * Site-visit picker: a strip of the next 14 days and hourly time slots.
 * Submits `scheduled_at` with an explicit India offset so the server (UTC) stores the right moment.
 */
export function VisitPicker() {
  const { t, lang } = useT();
  const locale = DATE_LOCALE[lang];
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");

  const days = useMemo(() => Array.from({ length: DAYS }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { v: ymd(d), date: d, i };
  }), []);
  const now = new Date();
  const today = ymd(now);
  const past = (slot: string) => day === today && Number(slot.slice(0, 2)) <= now.getHours();
  const timeLabel = (slot: string) => new Date(`2000-01-01T${slot}:00`).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  const chosen = days.find((d) => d.v === day);

  return (
    <div>
      <input type="hidden" name="scheduled_at" value={day && time ? `${day}T${time}:00+05:30` : ""} />

      <p className="label">{t("r.pickDay")}</p>
      <div className="no-scrollbar -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
        {days.map(({ v, date, i }) => {
          const on = v === day;
          return (
            <button key={v} type="button" onClick={() => { setDay(v); if (time && v === today && Number(time.slice(0, 2)) <= now.getHours()) setTime(""); }}
              aria-pressed={on} aria-label={date.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
              className={`flex w-[4.25rem] shrink-0 snap-start flex-col items-center rounded-2xl border-2 py-2.5 transition ${
                on ? "border-navy bg-navy text-white shadow-[var(--shadow-lift)]" : "border-line bg-white hover:border-sky"}`}>
              <span className={`text-[11px] font-bold uppercase ${on ? "text-ice" : "text-muted"}`}>
                {i === 0 ? t("r.today") : i === 1 ? t("r.tomorrow") : date.toLocaleDateString(locale, { weekday: "short" })}
              </span>
              <span className="display mt-0.5 text-2xl font-black leading-none">{date.getDate()}</span>
              <span className={`mt-0.5 text-[11px] font-semibold ${on ? "text-ice" : "text-muted"}`}>{date.toLocaleDateString(locale, { month: "short" })}</span>
            </button>
          );
        })}
      </div>

      <p className="label mt-4">{t("r.pickTime")}</p>
      {([[Sun, t("r.morning"), MORNING], [Sunset, t("r.afternoon"), AFTERNOON]] as const).map(([Icon, title, slots]) => (
        <div key={title} className="mb-2.5">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-muted"><Icon className="size-3.5 text-amber" /> {title}</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3">
            {slots.map((s) => {
              const on = s === time, off = !day || past(s);
              return (
                <button key={s} type="button" disabled={off} onClick={() => setTime(s)} aria-pressed={on}
                  className={`rounded-xl border-2 py-2 text-sm font-bold transition ${
                    on ? "border-brand bg-brand text-white shadow-[var(--shadow-glow)]" : off ? "border-line bg-surface text-muted/40" : "border-line bg-white hover:border-sky"}`}>
                  {timeLabel(s)}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <p className={`mt-1 flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm font-semibold ${chosen && time ? "bg-mint/10 text-mint" : "bg-surface text-muted"}`}>
        <CalendarCheck className="size-4 shrink-0" />
        {chosen && time
          ? t("r.visitSummary", { d: chosen.date.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" }), t: timeLabel(time) })
          : !day ? t("r.chooseDay") : t("r.chooseTime")}
      </p>
    </div>
  );
}
