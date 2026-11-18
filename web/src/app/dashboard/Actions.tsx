"use client";
import { useActionState, useState, useTransition } from "react";
import { Check, MessageSquareReply, Pause, Play, X } from "lucide-react";
import { ownerDecline, ownerQuote, reviewListing, setListingStatus, tenantQuoteAction, visitStatus } from "@/app/actions";

export function TenantQuoteActions({ id, status, rent }: { id: string; status: string; rent: number | null }) {
  const [pending, start] = useTransition();
  const [counter, setCounter] = useState(false);
  if (status === "requested") return <button disabled={pending} onClick={() => start(() => tenantQuoteAction(id, "withdrawn"))} className="text-xs font-bold text-muted hover:text-danger">Withdraw</button>;
  if (!["quoted", "negotiating"].includes(status)) return null;
  if (counter) {
    return (
      <form className="flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); const v = Number(new FormData(e.currentTarget).get("c")); if (v > 0) start(() => tenantQuoteAction(id, "negotiating", v)); setCounter(false); }}>
        <input name="c" type="number" step={0.5} min={1} defaultValue={rent ? rent - 1 : ""} aria-label="Counter rent per sq ft" className="field !w-20 !rounded-full !px-3 !py-1.5 text-sm" />
        <button className="btn btn-dark !px-3 !py-1.5 text-xs">Send</button>
        <button type="button" onClick={() => setCounter(false)} aria-label="Cancel" className="text-muted"><X className="size-4" /></button>
      </form>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      <button disabled={pending} onClick={() => start(() => tenantQuoteAction(id, "accepted"))} className="btn btn-primary !px-3 !py-1.5 text-xs"><Check className="size-3.5" /> Accept</button>
      <button disabled={pending} onClick={() => setCounter(true)} className="btn btn-ghost !px-3 !py-1.5 text-xs"><MessageSquareReply className="size-3.5" /> Counter</button>
      <button disabled={pending} onClick={() => start(() => tenantQuoteAction(id, "rejected"))} className="btn btn-ghost !px-3 !py-1.5 text-xs hover:!text-danger">Reject</button>
    </div>
  );
}

export function OwnerRespond({ q }: { q: { id: string; rent_psf: number | null; status: string; counter_rent_psf: number | null } }) {
  const [state, action, pending] = useActionState(ownerQuote, null);
  const [open, setOpen] = useState(false);
  const [declining, start] = useTransition();
  if (state?.ok) return <p className="text-sm font-bold text-success">✓ {state.message}</p>;
  if (!open) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setOpen(true)} className="btn btn-primary !px-4 !py-2 text-xs">{q.status === "requested" ? "Send quote" : "Revise quote"}</button>
        {q.status === "requested" && <button disabled={declining} onClick={() => start(() => ownerDecline(q.id))} className="btn btn-ghost !px-4 !py-2 text-xs">Decline</button>}
      </div>
    );
  }
  return (
    <form action={action} className="mt-3 grid grid-cols-2 gap-3 rounded-3xl bg-surface p-4 sm:grid-cols-4">
      <input type="hidden" name="id" value={q.id} />
      {([["rent_psf", "Rent ₹/sq ft", q.counter_rent_psf ?? q.rent_psf], ["cam_psf", "CAM ₹/sq ft", null], ["deposit_months", "Deposit (months)", 6], ["lock_in_months", "Lock-in (months)", 36],
        ["escalation_pct", "Escalation %", 5], ["rent_free_days", "Rent-free days", 30]] as const).map(([n, l, d]) => (
        <label key={n}><span className="label">{l}</span><input name={n} type="number" step="any" min={0} defaultValue={d ?? ""} required={n === "rent_psf"} className="field !bg-white" /></label>
      ))}
      <label><span className="label">Valid until</span><input name="valid_until" type="date" required className="field !bg-white" /></label>
      <label className="col-span-2 sm:col-span-4"><span className="label">Message</span><input name="owner_note" placeholder="Fit-out support, power upgrade, etc." className="field !bg-white" /></label>
      {state && !state.ok && <p className="col-span-full text-sm font-semibold text-danger">{state.error}</p>}
      <div className="col-span-full flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">Cancel</button>
        <button disabled={pending} className="btn btn-primary">{pending ? "Sending…" : "Send quote"}</button>
      </div>
    </form>
  );
}

export function VisitActions({ id, status, isOwner }: { id: string; status: string; isOwner: boolean }) {
  const [pending, start] = useTransition();
  if (status === "requested" && isOwner) {
    return (
      <div className="flex gap-1.5">
        <button disabled={pending} onClick={() => start(() => visitStatus(id, "confirmed"))} className="btn btn-primary !px-3 !py-1.5 text-xs">Confirm</button>
        <button disabled={pending} onClick={() => start(() => visitStatus(id, "cancelled"))} className="btn btn-ghost !px-3 !py-1.5 text-xs">Decline</button>
      </div>
    );
  }
  if (["requested", "confirmed"].includes(status)) {
    return <button disabled={pending} onClick={() => start(() => visitStatus(id, isOwner ? "done" : "cancelled"))} className="btn btn-ghost !px-3 !py-1.5 text-xs">{isOwner ? "Mark done" : "Cancel"}</button>;
  }
  return null;
}

export function ListingToggle({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  if (status === "live") return <button disabled={pending} onClick={() => start(() => setListingStatus(id, "paused"))} className="btn btn-ghost !px-3 !py-1.5 text-xs"><Pause className="size-3.5" /> Pause</button>;
  if (status === "paused") return <button disabled={pending} onClick={() => start(() => setListingStatus(id, "live"))} className="btn btn-ghost !px-3 !py-1.5 text-xs"><Play className="size-3.5" /> Resume</button>;
  return null;
}

export function ReviewButtons({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      <button disabled={pending} onClick={() => start(() => reviewListing(id, true))} className="btn btn-primary !py-2 text-xs"><Check className="size-4" /> Approve & verify</button>
      <button disabled={pending} onClick={() => { const r = prompt("Reason for changes requested?"); if (r) start(() => reviewListing(id, false, r)); }} className="btn btn-ghost !py-2 text-xs">Request changes</button>
    </div>
  );
}
