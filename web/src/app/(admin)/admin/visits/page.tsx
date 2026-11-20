import type { Metadata } from "next";
import Link from "next/link";
import { Phone } from "lucide-react";
import { requireAdminPage } from "@/lib/admin";
import { forwardVisit, setVisitStatus } from "../actions";
import { ActionButton, TableFilters } from "../ui";
import { Badge, Empty, PageHead, str, when } from "../shared";

export const metadata: Metadata = { title: "Site visits" };
const TODO = ["pending_review", "owner_responded"];
const FILTERS = ["needs-action", "all", "pending_review", "requested", "owner_responded", "confirmed", "done", "cancelled"] as const;
const isPast = (iso: string) => new Date(iso).getTime() < Date.now();

type Row = {
  id: string; status: string; scheduled_at: string; note: string | null; tenant_company: string | null; tenant_name: string | null; created_at: string;
  tenant: { phone: string | null } | null;
  listing: { id: string; name: string; micro_market: string | null; owner: { company_name: string | null; phone: string | null } | null } | null;
  offer: { status: string; owner_note: string | null } | { status: string; owner_note: string | null }[] | null;
};

export default async function AdminVisits({ searchParams }: PageProps<"/admin/visits">) {
  const { supabase } = await requireAdminPage();
  const status = str((await searchParams).status) || "needs-action";
  let query = supabase.from("visits")
    .select("id,status,scheduled_at,note,tenant_company,tenant_name,created_at,tenant:profiles!visits_tenant_id_fkey(phone),listing:listings(id,name,micro_market,owner:profiles!listings_owner_id_fkey(company_name,phone)),offer:visit_offers(status,owner_note)")
    .order("scheduled_at", { ascending: true }).limit(300);
  if (status === "needs-action") query = query.in("status", TODO); else if (status !== "all") query = query.eq("status", status);
  const rows = ((await query).data ?? []) as unknown as Row[];

  return (
    <>
      <PageHead title="Site visits" sub="Companies book through you. Ask the owner, then confirm with the company. Times are India time." />
      <div className="mb-4"><TableFilters statuses={FILTERS} /></div>
      {!rows.length ? <Empty text={status === "needs-action" ? "No visits need your action. 🎉" : "No site visits match."} /> : (
        <div className="overflow-x-auto rounded-[1.5rem] bg-white shadow-[var(--shadow-soft)] ring-1 ring-line">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-surface text-left text-[11px] font-bold uppercase tracking-wider text-muted">
              <tr>{["When", "Warehouse / owner", "Company (only you see this)", "Owner reply", "Stage", ""].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((v) => {
                const past = isPast(v.scheduled_at);
                const offer = Array.isArray(v.offer) ? v.offer[0] : v.offer;
                const owner = v.listing?.owner;
                return (
                  <tr key={v.id} className="border-t border-line align-middle">
                    <td className="px-4 py-3"><p className={`font-bold ${past ? "text-muted" : ""}`}>{when(v.scheduled_at, true)}</p>{past && <p className="text-[11px] text-muted">in the past</p>}</td>
                    <td className="px-4 py-3">
                      <Link href={`/warehouse/${v.listing?.id}`} target="_blank" className="font-bold hover:text-brand">{v.listing?.name ?? "—"}</Link>
                      <p className="text-xs text-muted">{owner?.company_name ?? "Platform listing"}{owner?.phone && <> · <a href={`tel:${owner.phone}`} className="font-bold text-brand">{owner.phone}</a></>}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{v.tenant_company ?? "—"} <span className="font-medium text-muted">{v.tenant_name ?? ""}</span></p>
                      {v.tenant?.phone && <a href={`tel:${v.tenant.phone}`} className="inline-flex items-center gap-1 text-xs font-bold text-brand"><Phone className="size-3" /> {v.tenant.phone}</a>}
                      {v.note && <p className="max-w-[16rem] text-xs text-muted">“{v.note}”</p>}
                    </td>
                    <td className="px-4 py-3">{offer ? <><Badge s={offer.status} />{offer.owner_note && <p className="mt-1 max-w-[12rem] text-xs text-muted">“{offer.owner_note}”</p>}</> : <span className="text-xs text-muted">—</span>}</td>
                    <td className="px-4 py-3"><Badge s={v.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {v.status === "pending_review" && owner && <ActionButton action={forwardVisit.bind(null, v.id)} className="bg-brand text-white hover:bg-royal">Ask owner</ActionButton>}
                        {["pending_review", "requested", "owner_responded"].includes(v.status) && <ActionButton action={setVisitStatus.bind(null, v.id, "confirmed")} className="bg-mint/10 text-mint hover:bg-mint/20">Confirm with company</ActionButton>}
                        {v.status === "confirmed" && <ActionButton action={setVisitStatus.bind(null, v.id, "done")} className="bg-navy/10 text-navy hover:bg-navy/20">Mark done</ActionButton>}
                        {!["done", "cancelled"].includes(v.status) && <ActionButton action={setVisitStatus.bind(null, v.id, "cancelled")} confirm="Cancel this visit? The company (and owner, if asked) will be told." className="bg-surface text-muted hover:text-coral">Cancel</ActionButton>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
