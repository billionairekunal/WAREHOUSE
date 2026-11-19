import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/admin";
import { setVisitStatus } from "../actions";
import { StatusSelect, TableFilters } from "../ui";
import { Empty, PageHead, str, when } from "../shared";

export const metadata: Metadata = { title: "Site visits" };
const STATUSES = ["requested", "confirmed", "done", "cancelled"] as const;
const isPast = (iso: string) => new Date(iso).getTime() < Date.now();

type Row = {
  id: string; status: string; scheduled_at: string; note: string | null; tenant_company: string | null; tenant_name: string | null; created_at: string;
  listing: { id: string; name: string; micro_market: string | null; owner: { company_name: string | null; phone: string | null } | null } | null;
};

export default async function AdminVisits({ searchParams }: PageProps<"/admin/visits">) {
  const { supabase } = await requireAdminPage();
  const status = str((await searchParams).status);
  let query = supabase.from("visits")
    .select("id,status,scheduled_at,note,tenant_company,tenant_name,created_at,listing:listings(id,name,micro_market,owner:profiles!listings_owner_id_fkey(company_name,phone))")
    .order("scheduled_at", { ascending: true }).limit(300);
  if (status) query = query.eq("status", status);
  const rows = ((await query).data ?? []) as unknown as Row[];

  return (
    <>
      <PageHead title="Site visits" sub={`${rows.length} shown, soonest first. Times are India time.`} />
      <div className="mb-4"><TableFilters statuses={STATUSES} /></div>
      {!rows.length ? <Empty text="No site visits match." /> : (
        <div className="overflow-x-auto rounded-[1.5rem] bg-white shadow-[var(--shadow-soft)] ring-1 ring-line">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-surface text-left text-[11px] font-bold uppercase tracking-wider text-muted">
              <tr>{["When", "Warehouse / owner", "Visitor", "Note", "Status"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((v) => {
                const past = isPast(v.scheduled_at);
                return (
                  <tr key={v.id} className="border-t border-line align-middle">
                    <td className="px-4 py-3"><p className={`font-bold ${past ? "text-muted" : ""}`}>{when(v.scheduled_at, true)}</p>{past && <p className="text-[11px] text-muted">in the past</p>}</td>
                    <td className="px-4 py-3">
                      <Link href={`/warehouse/${v.listing?.id}`} target="_blank" className="font-bold hover:text-brand">{v.listing?.name ?? "—"}</Link>
                      <p className="text-xs text-muted">{v.listing?.owner?.company_name ?? "Platform sample"}{v.listing?.owner?.phone ? ` · ${v.listing.owner.phone}` : ""}</p>
                    </td>
                    <td className="px-4 py-3"><p className="font-semibold">{v.tenant_company ?? "—"}</p><p className="text-xs text-muted">{v.tenant_name ?? ""}</p></td>
                    <td className="max-w-[14rem] px-4 py-3 text-xs text-muted">{v.note ?? "—"}</td>
                    <td className="px-4 py-3"><StatusSelect action={setVisitStatus.bind(null, v.id)} value={v.status} options={STATUSES} label="Visit status" /></td>
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
