import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Phone, UserRound } from "lucide-react";
import { requireAdminPage } from "@/lib/admin";
import { sqft } from "@/lib/data";
import { closeDeal, forwardCounter, forwardQuote, sendQuote } from "../actions";
import { ActionForm, StatusSelect, TableFilters } from "../ui";
import { Badge, Empty, PageHead, str, when } from "../shared";

export const metadata: Metadata = { title: "Deals" };
const TODO = ["pending_review", "owner_quoted", "counter_review", "accepted"];
const FILTERS = ["needs-action", "all", "pending_review", "requested", "owner_quoted", "quoted", "counter_review", "negotiating", "accepted", "won", "rejected", "withdrawn", "expired"] as const;
const OPEN = ["pending_review", "requested", "owner_quoted", "quoted", "counter_review", "negotiating", "accepted"];

type Terms = { rent_psf: number | null; cam_psf: number | null; deposit_months: number | null; lock_in_months: number | null; escalation_pct: number | null; rent_free_days: number | null; valid_until: string | null };
type Offer = Terms & { status: string; owner_note: string | null; counter_rent_psf: number | null; requirements: string | null; updated_at: string };
type Row = Terms & {
  id: string; status: string; area_sqft: number; move_in: string | null; tenure_months: number | null; tenant_note: string | null; owner_note: string | null;
  counter_rent_psf: number | null; tenant_company: string | null; tenant_name: string | null; created_at: string; updated_at: string;
  tenant: { phone: string | null } | null;
  listing: { id: string; name: string; micro_market: string | null; rent_psf: number | null; owner: { company_name: string | null; full_name: string | null; phone: string | null } | null } | null;
  offer: Offer | Offer[] | null;
};

export default async function AdminDeals({ searchParams }: PageProps<"/admin/quotes">) {
  const { supabase } = await requireAdminPage();
  const status = str((await searchParams).status) || "needs-action";
  let query = supabase.from("quotes")
    .select("*, tenant:profiles!quotes_tenant_id_fkey(phone), listing:listings(id,name,micro_market,rent_psf,owner:profiles!listings_owner_id_fkey(company_name,full_name,phone)), offer:quote_offers(*)")
    .order("updated_at", { ascending: false }).limit(200);
  if (status === "needs-action") query = query.in("status", TODO); else if (status !== "all") query = query.eq("status", status);
  const rows = ((await query).data ?? []) as unknown as Row[];

  return (
    <>
      <PageHead title="Deals" sub="Every quote request passes through you. Owners never see who the company is; companies only see quotes you approve." />
      <div className="mb-4"><TableFilters statuses={FILTERS} /></div>
      {!rows.length ? <Empty text={status === "needs-action" ? "Nothing needs your action. 🎉" : "No deals match."} /> : (
        <ul className="space-y-4">{rows.map((q) => <Deal key={q.id} q={q} />)}</ul>
      )}
    </>
  );
}

function Deal({ q }: { q: Row }) {
  const offer = Array.isArray(q.offer) ? q.offer[0] ?? null : q.offer;
  const owner = q.listing?.owner;
  const open = OPEN.includes(q.status);
  // prefill the company quote with the owner's latest terms, else what the company already has, else the listed rent
  const base: Terms = offer?.rent_psf && q.status === "owner_quoted" ? offer : q.rent_psf ? q : { ...q, rent_psf: q.listing?.rent_psf ?? null };

  return (
    <li className="rounded-[1.5rem] bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-line">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/warehouse/${q.listing?.id}`} target="_blank" className="text-lg font-extrabold hover:text-brand">{q.listing?.name ?? "—"}</Link>
          <p className="text-sm text-muted">{q.listing?.micro_market ?? ""} · {sqft(q.area_sqft)} · move-in {when(q.move_in)} · {q.tenure_months ?? "—"} months · requested {when(q.created_at, true)}</p>
        </div>
        <Badge s={q.status} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Party title="Company (only you see this)" icon={UserRound} name={q.tenant_company ?? "—"} sub={q.tenant_name} phone={q.tenant?.phone} note={q.tenant_note} />
        <Party title="Owner" icon={Building2} name={owner?.company_name ?? "Platform listing (no owner account)"} sub={owner?.full_name} phone={owner?.phone}
          note={offer ? `Owner side: ${offer.status.replace("_", " ")}${offer.owner_note ? ` · “${offer.owner_note}”` : ""}` : null} />
      </div>

      {(offer?.rent_psf || q.rent_psf || q.counter_rent_psf) && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {offer?.rent_psf && <Chip label="Owner asks" value={`₹${offer.rent_psf}/sq ft`} terms={offer} />}
          {q.rent_psf && <Chip label="Company sees" value={`₹${q.rent_psf}/sq ft`} terms={q} />}
          {q.counter_rent_psf && <Chip label="Company counter" value={`₹${q.counter_rent_psf}/sq ft`} hot />}
        </div>
      )}

      {open && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          {q.status === "pending_review" && owner && (
            <ActionForm action={forwardQuote.bind(null, q.id)} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex-1"><span className="label">Requirements for the owner (no company name or contact)</span>
                <input name="requirements" defaultValue={offer?.requirements ?? ""} maxLength={1000} placeholder="e.g. FMCG storage, 2 docks, 24×7 access" className="field" /></label>
              <button className="btn btn-primary shrink-0">Forward to owner</button>
            </ActionForm>
          )}
          {q.status === "counter_review" && offer && (
            <ActionForm action={forwardCounter.bind(null, q.id)} className="flex flex-wrap items-end gap-2">
              <label><span className="label">Counter for the owner ₹/sq ft</span>
                <input name="counter_rent_psf" type="number" step="any" min={0} required defaultValue={q.counter_rent_psf ?? ""} className="field !w-40" /></label>
              <button className="btn btn-primary">Forward counter to owner</button>
            </ActionForm>
          )}
          {q.status !== "accepted" && (
            <details open={q.status === "owner_quoted" || (q.status === "pending_review" && !owner)} className="rounded-2xl bg-surface p-3">
              <summary className="cursor-pointer text-sm font-bold">
                {q.status === "owner_quoted" ? "Approve owner's quote → send to company (adjust if needed)" : q.status === "quoted" ? "Revise the company's quote" : "Send a quote to the company directly"}
              </summary>
              <ActionForm action={sendQuote.bind(null, q.id)} className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {([["rent_psf", "Rent ₹/sq ft", base.rent_psf], ["cam_psf", "CAM ₹/sq ft", base.cam_psf], ["deposit_months", "Deposit (months)", base.deposit_months],
                  ["lock_in_months", "Lock-in (months)", base.lock_in_months], ["escalation_pct", "Escalation %", base.escalation_pct], ["rent_free_days", "Rent-free days", base.rent_free_days]] as const).map(([k, l, v]) => (
                  <label key={k}><span className="label">{l}</span><input name={k} type="number" step="any" min={0} required={k === "rent_psf"} defaultValue={v ?? ""} className="field !bg-white" /></label>
                ))}
                <label><span className="label">Valid until</span><input name="valid_until" type="date" defaultValue={base.valid_until ?? ""} className="field !bg-white" /></label>
                <label className="col-span-2 sm:col-span-4"><span className="label">Message to company (no owner contact)</span>
                  <input name="note" maxLength={1000} defaultValue={q.status === "owner_quoted" ? "" : q.owner_note ?? ""} className="field !bg-white" /></label>
                <div className="col-span-full flex justify-end"><button className="btn btn-primary">Send to company</button></div>
              </ActionForm>
            </details>
          )}
          <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
            <span className="font-semibold text-muted">Close deal:</span>
            <StatusSelect action={closeDeal.bind(null, q.id)} value="" options={["", "won", "rejected", "expired"]} label="Close deal as" />
          </div>
        </div>
      )}
    </li>
  );
}

function Party({ title, icon: Icon, name, sub, phone, note }: { title: string; icon: typeof Phone; name: string; sub?: string | null; phone?: string | null; note?: string | null }) {
  return (
    <div className="rounded-2xl bg-surface p-3 text-sm">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{title}</p>
      <p className="mt-1 flex items-center gap-1.5 font-bold"><Icon className="size-4 text-brand" /> {name}{sub && <span className="font-medium text-muted">· {sub}</span>}</p>
      {phone && <a href={`tel:${phone}`} className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-bold text-brand"><Phone className="size-3.5" /> {phone}</a>}
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}

function Chip({ label, value, terms, hot }: { label: string; value: string; terms?: Terms; hot?: boolean }) {
  const extra = terms ? [terms.deposit_months != null && `${terms.deposit_months} mo deposit`, terms.lock_in_months != null && `${terms.lock_in_months} mo lock-in`, terms.escalation_pct != null && `${terms.escalation_pct}% esc.`].filter(Boolean).join(" · ") : "";
  return (
    <span className={`rounded-2xl px-3 py-2 ${hot ? "bg-coral/10 text-coral" : "bg-ice/50 text-navy"}`}>
      <b>{label}: {value}</b>{extra && <span className="block text-[11px] opacity-80">{extra}</span>}
    </span>
  );
}
