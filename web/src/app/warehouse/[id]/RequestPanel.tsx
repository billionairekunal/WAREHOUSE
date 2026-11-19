"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { CalendarClock, CheckCircle2, FileText, Info } from "lucide-react";
import { requestQuote, requestVisit } from "@/app/actions";
import { costBreakdown, inr } from "@/lib/data";
import { useT } from "@/lib/i18n/client";

type L = {
  id: string; rent_psf: number | null; cam_psf: number | null; deposit_months: number | null;
  lock_in_months: number | null; escalation_pct: number | null; area_available: number | null; area_min: number | null;
};

export function RequestPanel({ l, loggedIn, isOwner }: { l: L; loggedIn: boolean; isOwner: boolean }) {
  const { t } = useT();
  const [tab, setTab] = useState<"quote" | "visit">("quote");
  const [area, setArea] = useState(l.area_min ?? l.area_available ?? 10000);
  const [qState, quoteAction, qPending] = useActionState(requestQuote, null);
  const [vState, visitAction, vPending] = useActionState(requestVisit, null);
  const c = costBreakdown(area || 0, l.rent_psf ?? 0, l.cam_psf ?? 0, l.deposit_months ?? 0, l.lock_in_months ?? 0, l.escalation_pct ?? 0);
  const state = tab === "quote" ? qState : vState;

  return (
    <div id="request" className="card scroll-mt-28 p-5 sm:p-6">
      <div className="flex items-end justify-between">
        <p><span className="text-4xl font-extrabold text-navy display">₹{l.rent_psf ?? "—"}</span><span className="text-sm text-muted"> {t("r.perMonth")}</span></p>
        {l.cam_psf ? <p className="text-xs font-semibold text-muted">{t("r.cam", { n: l.cam_psf })}</p> : null}
      </div>

      {/* True cost calculator */}
      <div className="mt-5 rounded-3xl bg-surface p-4">
        <label className="label" htmlFor="area-calc">{t("r.area")}</label>
        <input id="area-calc" type="number" min={l.area_min ?? 0} max={l.area_available ?? undefined} step={500}
          value={area} onChange={(e) => setArea(Number(e.target.value))} className="field !bg-white" />
        <dl className="mt-4 space-y-2 text-sm">
          <Row k={t("r.rentCam")} v={inr(c.base)} />
          <Row k={t("r.gst")} v={inr(c.gst)} />
          <Row k={t("r.monthly")} v={inr(c.monthly)} strong />
          <Row k={t("r.deposit", { n: l.deposit_months ?? 0 })} v={inr(c.deposit)} />
          {l.lock_in_months ? <Row k={t("r.total", { n: l.lock_in_months })} v={inr(c.total)} strong /> : null}
        </dl>
        <p className="mt-3 flex gap-1.5 text-[11px] text-muted"><Info className="size-3.5 shrink-0" /> {t("r.estimate", { n: l.escalation_pct ?? 0 })}</p>
      </div>

      {isOwner ? (
        <p className="mt-5 rounded-2xl bg-ice/60 p-4 text-sm font-semibold text-royal">{t("r.yours")}</p>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-full bg-surface p-1 text-sm font-bold">
            {(["quote", "visit"] as const).map((tb) => (
              <button key={tb} onClick={() => setTab(tb)} aria-pressed={tab === tb}
                className={`flex items-center justify-center gap-1.5 rounded-full py-2.5 transition ${tab === tb ? "bg-white text-navy shadow" : "text-muted"}`}>
                {tb === "quote" ? <><FileText className="size-4" /> {t("r.tabQuote")}</> : <><CalendarClock className="size-4" /> {t("r.tabVisit")}</>}
              </button>
            ))}
          </div>

          {state?.ok ? (
            <div className="mt-5 rounded-3xl bg-success/10 p-5 text-center">
              <CheckCircle2 className="mx-auto size-8 text-success" />
              <p className="mt-2 font-bold text-success">{state.message}</p>
              <Link href="/dashboard" className="btn btn-ghost mt-4">{t("r.track")}</Link>
            </div>
          ) : !loggedIn ? (
            <div className="mt-5 text-center">
              <Link href={`/login?next=/warehouse/${l.id}`} className="btn btn-primary w-full !py-3.5">{t("r.signIn")}</Link>
              <p className="mt-2 text-xs text-muted">{t("r.free")}</p>
            </div>
          ) : tab === "quote" ? (
            <form action={quoteAction} className="mt-5 space-y-3">
              <input type="hidden" name="listing_id" value={l.id} />
              <input type="hidden" name="area_sqft" value={area} />
              <div className="grid grid-cols-2 gap-3">
                <label><span className="label">{t("r.moveIn")}</span><input name="move_in" type="date" className="field" /></label>
                <label><span className="label">{t("r.tenure")}</span>
                  <select name="tenure_months" className="field" defaultValue="36">
                    {[3, 6, 12, 24, 36, 60].map((m) => <option key={m} value={m}>{m < 12 ? t("r.monthsN", { n: m }) : t("r.yr", { n: m / 12 })}</option>)}
                  </select></label>
              </div>
              <label className="block"><span className="label">{t("r.req")}</span>
                <textarea name="tenant_note" rows={3} placeholder={t("r.reqPh")} className="field resize-none" /></label>
              {state && !state.ok && <p className="text-sm font-semibold text-danger">{state.error}</p>}
              <button disabled={qPending} className="btn btn-primary w-full !py-3.5">{qPending ? t("r.sending") : t("r.requestFor", { n: area.toLocaleString("en-IN") })}</button>
            </form>
          ) : (
            <form action={visitAction} className="mt-5 space-y-3">
              <input type="hidden" name="listing_id" value={l.id} />
              <label className="block"><span className="label">{t("r.when")}</span>
                <input name="scheduled_at" type="datetime-local" required className="field" /></label>
              <label className="block"><span className="label">{t("r.note")}</span>
                <input name="note" placeholder={t("r.notePh")} className="field" /></label>
              {state && !state.ok && <p className="text-sm font-semibold text-danger">{state.error}</p>}
              <button disabled={vPending} className="btn btn-primary w-full !py-3.5">{vPending ? t("r.booking") : t("r.requestVisit")}</button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? "border-t border-line pt-2 font-extrabold text-ink" : "text-muted"}`}>
      <dt>{k}</dt><dd className={strong ? "text-brand" : "font-semibold text-ink"}>{v}</dd>
    </div>
  );
}
