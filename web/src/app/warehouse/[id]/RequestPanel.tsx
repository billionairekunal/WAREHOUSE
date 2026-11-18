"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { CalendarClock, CheckCircle2, FileText, Info } from "lucide-react";
import { requestQuote, requestVisit } from "@/app/actions";
import { costBreakdown, inr } from "@/lib/data";

type L = {
  id: string; rent_psf: number | null; cam_psf: number | null; deposit_months: number | null;
  lock_in_months: number | null; escalation_pct: number | null; area_available: number | null; area_min: number | null;
};

export function RequestPanel({ l, loggedIn, isOwner }: { l: L; loggedIn: boolean; isOwner: boolean }) {
  const [tab, setTab] = useState<"quote" | "visit">("quote");
  const [area, setArea] = useState(l.area_min ?? l.area_available ?? 10000);
  const [qState, quoteAction, qPending] = useActionState(requestQuote, null);
  const [vState, visitAction, vPending] = useActionState(requestVisit, null);
  const c = costBreakdown(area || 0, l.rent_psf ?? 0, l.cam_psf ?? 0, l.deposit_months ?? 0, l.lock_in_months ?? 0, l.escalation_pct ?? 0);
  const state = tab === "quote" ? qState : vState;

  return (
    <div id="request" className="card scroll-mt-28 p-5 sm:p-6">
      <div className="flex items-end justify-between">
        <p><span className="text-4xl font-extrabold text-navy display">₹{l.rent_psf ?? "—"}</span><span className="text-sm text-muted"> /sq ft/month</span></p>
        {l.cam_psf ? <p className="text-xs font-semibold text-muted">+ ₹{l.cam_psf} CAM</p> : null}
      </div>

      {/* True cost calculator */}
      <div className="mt-5 rounded-3xl bg-surface p-4">
        <label className="label" htmlFor="area-calc">Area you need (sq ft)</label>
        <input id="area-calc" type="number" min={l.area_min ?? 0} max={l.area_available ?? undefined} step={500}
          value={area} onChange={(e) => setArea(Number(e.target.value))} className="field !bg-white" />
        <dl className="mt-4 space-y-2 text-sm">
          <Row k="Rent + CAM" v={inr(c.base)} />
          <Row k="GST (18%)" v={inr(c.gst)} />
          <Row k="Monthly outgo" v={inr(c.monthly)} strong />
          <Row k={`Security deposit (${l.deposit_months ?? 0} mo)`} v={inr(c.deposit)} />
          {l.lock_in_months ? <Row k={`Total cost over ${l.lock_in_months}-mo lock-in`} v={inr(c.total)} strong /> : null}
        </dl>
        <p className="mt-3 flex gap-1.5 text-[11px] text-muted"><Info className="size-3.5 shrink-0" /> Estimate incl. {l.escalation_pct ?? 0}% yearly escalation. Final terms come in the owner&apos;s quote.</p>
      </div>

      {isOwner ? (
        <p className="mt-5 rounded-2xl bg-ice/60 p-4 text-sm font-semibold text-royal">This is your listing. Manage requests from your dashboard.</p>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-full bg-surface p-1 text-sm font-bold">
            {(["quote", "visit"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} aria-pressed={tab === t}
                className={`flex items-center justify-center gap-1.5 rounded-full py-2.5 transition ${tab === t ? "bg-white text-navy shadow" : "text-muted"}`}>
                {t === "quote" ? <><FileText className="size-4" /> Get quote</> : <><CalendarClock className="size-4" /> Site visit</>}
              </button>
            ))}
          </div>

          {state?.ok ? (
            <div className="mt-5 rounded-3xl bg-success/10 p-5 text-center">
              <CheckCircle2 className="mx-auto size-8 text-success" />
              <p className="mt-2 font-bold text-success">{state.message}</p>
              <Link href="/dashboard" className="btn btn-ghost mt-4">Track in dashboard</Link>
            </div>
          ) : !loggedIn ? (
            <div className="mt-5 text-center">
              <Link href={`/login?next=/warehouse/${l.id}`} className="btn btn-primary w-full !py-3.5">Sign in to request</Link>
              <p className="mt-2 text-xs text-muted">Free for companies. Your number stays private until you choose to share it.</p>
            </div>
          ) : tab === "quote" ? (
            <form action={quoteAction} className="mt-5 space-y-3">
              <input type="hidden" name="listing_id" value={l.id} />
              <input type="hidden" name="area_sqft" value={area} />
              <div className="grid grid-cols-2 gap-3">
                <label><span className="label">Move-in</span><input name="move_in" type="date" className="field" /></label>
                <label><span className="label">Tenure</span>
                  <select name="tenure_months" className="field" defaultValue="36">
                    {[3, 6, 12, 24, 36, 60].map((m) => <option key={m} value={m}>{m < 12 ? `${m} months` : `${m / 12} yr`}</option>)}
                  </select></label>
              </div>
              <label className="block"><span className="label">Requirements (optional)</span>
                <textarea name="tenant_note" rows={3} placeholder="e.g. Need 2 docks, racking, 24x7 access" className="field resize-none" /></label>
              {state && !state.ok && <p className="text-sm font-semibold text-danger">{state.error}</p>}
              <button disabled={qPending} className="btn btn-primary w-full !py-3.5">{qPending ? "Sending…" : `Request quote for ${area.toLocaleString("en-IN")} sq ft`}</button>
            </form>
          ) : (
            <form action={visitAction} className="mt-5 space-y-3">
              <input type="hidden" name="listing_id" value={l.id} />
              <label className="block"><span className="label">Preferred date & time</span>
                <input name="scheduled_at" type="datetime-local" required className="field" /></label>
              <label className="block"><span className="label">Note (optional)</span>
                <input name="note" placeholder="Who is visiting, vehicle no." className="field" /></label>
              {state && !state.ok && <p className="text-sm font-semibold text-danger">{state.error}</p>}
              <button disabled={vPending} className="btn btn-primary w-full !py-3.5">{vPending ? "Booking…" : "Request site visit"}</button>
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
