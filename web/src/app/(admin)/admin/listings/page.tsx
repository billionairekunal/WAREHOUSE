import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ExternalLink, ShieldOff, Trash2 } from "lucide-react";
import { requireAdminPage } from "@/lib/admin";
import { img, sqft } from "@/lib/data";
import { deleteListing, setListingStatus, setVerified } from "../actions";
import { ActionButton, StatusSelect, TableFilters } from "../ui";
import { Badge, Empty, PageHead, safeSearch, str, when } from "../shared";

export const metadata: Metadata = { title: "Listings" };
const STATUSES = ["submitted", "live", "paused", "leased", "rejected", "draft"] as const;

type Row = {
  id: string; name: string; micro_market: string | null; status: string; verified: boolean; rent_psf: number | null;
  area_available: number | null; photos: string[]; updated_at: string; owner: { full_name: string | null; company_name: string | null } | null;
};

export default async function AdminListings({ searchParams }: PageProps<"/admin/listings">) {
  const { supabase } = await requireAdminPage();
  const sp = await searchParams;
  const status = str(sp.status), q = safeSearch(str(sp.q));
  let query = supabase.from("listings")
    .select("id,name,micro_market,status,verified,rent_psf,area_available,photos,updated_at,owner:profiles!listings_owner_id_fkey(full_name,company_name)")
    .order("updated_at", { ascending: false }).limit(200);
  if (status) query = query.eq("status", status);
  if (q) query = query.or(`name.ilike.%${q}%,micro_market.ilike.%${q}%,address.ilike.%${q}%`);
  const rows = ((await query).data ?? []) as unknown as Row[];

  return (
    <>
      <PageHead title="Listings" sub={`${rows.length} shown. Change status, verify, view or delete any listing.`} />
      <div className="mb-4"><TableFilters statuses={STATUSES} placeholder="Search name, area or address…" /></div>
      {!rows.length ? <Empty text="No listings match." /> : (
        <div className="overflow-x-auto rounded-[1.5rem] bg-white shadow-[var(--shadow-soft)] ring-1 ring-line">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-surface text-left text-[11px] font-bold uppercase tracking-wider text-muted">
              <tr>{["Listing", "Owner", "Area / rent", "Status", "Verified", "Updated", ""].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-t border-line align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-ice">
                        {l.photos[0] && <Image src={img(l.photos[0], 120)} alt="" fill sizes="48px" className="object-cover" />}
                      </div>
                      <div className="min-w-0"><p className="max-w-[16rem] truncate font-bold">{l.name || "Untitled draft"}</p><p className="text-xs text-muted">{l.micro_market ?? "—"}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><p className="font-semibold">{l.owner?.company_name ?? "Platform sample"}</p><p className="text-xs text-muted">{l.owner?.full_name ?? ""}</p></td>
                  <td className="px-4 py-3"><p className="font-semibold">{sqft(l.area_available)}</p><p className="text-xs text-muted">{l.rent_psf ? `₹${l.rent_psf}/sq ft` : "—"}</p></td>
                  <td className="px-4 py-3"><StatusSelect action={setListingStatus.bind(null, l.id)} value={l.status} options={STATUSES} label={`Status of ${l.name}`} /></td>
                  <td className="px-4 py-3">
                    {l.verified
                      ? <ActionButton action={setVerified.bind(null, l.id, false)} title="Remove verified badge" className="bg-mint/10 text-mint hover:bg-mint/20"><BadgeCheck className="size-3.5" /> Verified</ActionButton>
                      : <ActionButton action={setVerified.bind(null, l.id, true)} title="Give verified badge" className="bg-surface text-muted hover:text-ink"><ShieldOff className="size-3.5" /> Not verified</ActionButton>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{when(l.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <Link href={`/warehouse/${l.id}`} target="_blank" aria-label={`View ${l.name}`} className="grid size-8 place-items-center rounded-full bg-surface hover:text-brand"><ExternalLink className="size-4" /></Link>
                      <ActionButton action={deleteListing.bind(null, l.id)} confirm={`Delete “${l.name}” permanently? Its quotes and visits are deleted too. This cannot be undone.`}
                        title="Delete listing" className="!size-8 !p-0 bg-coral/10 text-coral hover:bg-coral hover:text-white"><Trash2 className="size-4" /></ActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-muted">Tip: <Badge s="submitted" /> listings are reviewed in Approvals, where you can send the owner a reason.</p>
    </>
  );
}
