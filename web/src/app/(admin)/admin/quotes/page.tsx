import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/admin";
import { sqft } from "@/lib/data";
import { setQuoteStatus } from "../actions";
import { StatusSelect, TableFilters } from "../ui";
import { Empty, PageHead, str, when } from "../shared";

export const metadata: Metadata = { title: "Quotes" };
const STATUSES = ["requested", "quoted", "negotiating", "accepted", "rejected", "withdrawn", "expired"] as const;

type Row = {
  id: string; status: string; area_sqft: number; rent_psf: number | null; counter_rent_psf: number | null; move_in: string | null;
  tenant_company: string | null; tenant_name: string | null; created_at: string; valid_until: string | null;
  listing: { id: string; name: string; owner: { company_name: string | null } | null } | null;
};

export default async function AdminQuotes({ searchParams }: PageProps<"/admin/quotes">) {
  const { supabase } = await requireAdminPage();
  const status = str((await searchParams).status);
  let query = supabase.from("quotes")
    .select("id,status,area_sqft,rent_psf,counter_rent_psf,move_in,tenant_company,tenant_name,created_at,valid_until,listing:listings(id,name,owner:profiles!listings_owner_id_fkey(company_name))")
    .order("created_at", { ascending: false }).limit(300);
  if (status) query = query.eq("status", status);
  const rows = ((await query).data ?? []) as unknown as Row[];

  return (
    <>
      <PageHead title="Quotes" sub={`${rows.length} shown. Every quote request between companies and owners.`} />
      <div className="mb-4"><TableFilters statuses={STATUSES} /></div>
      {!rows.length ? <Empty text="No quotes match." /> : (
        <div className="overflow-x-auto rounded-[1.5rem] bg-white shadow-[var(--shadow-soft)] ring-1 ring-line">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-surface text-left text-[11px] font-bold uppercase tracking-wider text-muted">
              <tr>{["Warehouse / owner", "Company", "Area", "Quoted rent", "Move-in", "Created", "Status"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((q) => (
                <tr key={q.id} className="border-t border-line align-middle">
                  <td className="px-4 py-3">
                    <Link href={`/warehouse/${q.listing?.id}`} target="_blank" className="font-bold hover:text-brand">{q.listing?.name ?? "—"}</Link>
                    <p className="text-xs text-muted">{q.listing?.owner?.company_name ?? "Platform sample"}</p>
                  </td>
                  <td className="px-4 py-3"><p className="font-semibold">{q.tenant_company ?? "—"}</p><p className="text-xs text-muted">{q.tenant_name ?? ""}</p></td>
                  <td className="px-4 py-3">{sqft(q.area_sqft)}</td>
                  <td className="px-4 py-3">
                    {q.rent_psf ? <b>₹{q.rent_psf}</b> : <span className="text-muted">—</span>}
                    {q.counter_rent_psf && <p className="text-xs font-semibold text-amber">Counter ₹{q.counter_rent_psf}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs">{when(q.move_in)}</td>
                  <td className="px-4 py-3 text-xs text-muted">{when(q.created_at, true)}</td>
                  <td className="px-4 py-3"><StatusSelect action={setQuoteStatus.bind(null, q.id)} value={q.status} options={STATUSES} label="Quote status" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
