"use client";
import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { ActionForm } from "../ui";

type Terms = { rent_psf: number | null; cam_psf: number | null; deposit_months: number | null; lock_in_months: number | null; escalation_pct: number | null; rent_free_days: number | null; valid_until: string | null };
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** The quote the company will see, with a live margin preview against the owner's ask. */
export function QuoteForm({ action, base, ownerAsk, area, note, cta }: {
  action: (fd: FormData) => Promise<void>; base: Terms; ownerAsk: number | null; area: number; note: string; cta: string;
}) {
  const [rent, setRent] = useState(base.rent_psf ?? 0);
  const margin = ownerAsk ? rent - ownerAsk : null;
  const fields = [["cam_psf", "CAM ₹/sq ft", base.cam_psf], ["deposit_months", "Deposit (months)", base.deposit_months], ["lock_in_months", "Lock-in (months)", base.lock_in_months],
    ["escalation_pct", "Escalation %", base.escalation_pct], ["rent_free_days", "Rent-free days", base.rent_free_days]] as const;

  return (
    <ActionForm action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:items-end">
        <label><span className="label">Rent for the company ₹/sq ft *</span>
          <input name="rent_psf" type="number" step="any" min={0} required value={rent || ""} onChange={(e) => setRent(Number(e.target.value))} className="field !bg-white text-lg font-extrabold" /></label>
        <div className={`rounded-2xl px-4 py-3 text-sm ${margin == null ? "bg-white text-muted" : margin > 0 ? "bg-mint/10 text-mint" : "bg-coral/10 text-coral"}`}>
          {margin == null ? <>Company pays <b className="text-ink">{inr(rent * area)}/month</b> for {area.toLocaleString("en-IN")} sq ft.</>
            : <span className="flex items-center gap-2 font-semibold"><TrendingUp className="size-4 shrink-0" />
              {margin > 0 ? <>Your margin <b>₹{+margin.toFixed(2)}/sq ft = {inr(margin * area)}/month</b> ({((margin / rent) * 100).toFixed(1)}%)</>
                : <>No margin: owner asks ₹{ownerAsk}. Raise the rent to earn on this deal.</>}</span>}
        </div>
      </div>
      <details className="rounded-2xl bg-white/70 px-3 py-2">
        <summary className="cursor-pointer text-xs font-bold text-muted">Other terms (CAM, deposit, lock-in…)</summary>
        <div className="mt-2 grid grid-cols-2 gap-3 pb-1 sm:grid-cols-3">
          {fields.map(([k, l, v]) => <label key={k}><span className="label">{l}</span><input name={k} type="number" step="any" min={0} defaultValue={v ?? ""} className="field !bg-white" /></label>)}
          <label><span className="label">Valid until</span><input name="valid_until" type="date" defaultValue={base.valid_until ?? ""} className="field !bg-white" /></label>
        </div>
      </details>
      <label className="block"><span className="label">Message to the company (never include owner contact)</span>
        <input name="note" maxLength={1000} defaultValue={note} placeholder="e.g. Includes 2 dedicated docks. Can be ready in 15 days." className="field !bg-white" /></label>
      <div className="flex justify-end"><button className="btn btn-primary">{cta}</button></div>
    </ActionForm>
  );
}
