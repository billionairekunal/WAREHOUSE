import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Check, ExternalLink, Flame, MapPin, ShieldCheck } from "lucide-react";
import { requireAdminPage } from "@/lib/admin";
import { img, sqft } from "@/lib/data";
import { approveListing, requestChanges } from "../actions";
import { ActionButton, RequestChanges } from "../ui";
import { Empty, PageHead, when } from "../shared";

export const metadata: Metadata = { title: "Approvals" };

type Row = {
  id: string; name: string; micro_market: string | null; address: string | null; primary_type: string | null; area_available: number | null;
  rent_psf: number | null; clear_height_m: number | null; docks: number | null; power_kva: number | null; fire_noc: boolean;
  fire_noc_expiry: string | null; photos: string[]; lat: number | null; lng: number | null; updated_at: string; description: string | null;
  owner: { full_name: string | null; company_name: string | null; phone: string | null } | null;
};

export default async function Approvals() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase.from("listings")
    .select("id,name,micro_market,address,primary_type,area_available,rent_psf,clear_height_m,docks,power_kva,fire_noc,fire_noc_expiry,photos,lat,lng,updated_at,description,owner:profiles!listings_owner_id_fkey(full_name,company_name,phone)")
    .eq("status", "submitted").order("updated_at");
  const queue = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageHead title="Approvals" sub={`${queue.length} listing${queue.length === 1 ? "" : "s"} waiting. Approve only after the site visit and document check.`} />
      {!queue.length && <Empty text="🎉 The queue is clear. New submissions will appear here." />}
      <ul className="space-y-5">
        {queue.map((l) => (
          <li key={l.id} className="overflow-hidden rounded-[1.75rem] bg-white shadow-[var(--shadow-soft)] ring-1 ring-line">
            <div className="grid gap-0 lg:grid-cols-[380px_1fr]">
              <div className="grid grid-cols-2 gap-1 bg-surface p-1">
                {(l.photos.length ? l.photos.slice(0, 4) : [""]).map((p, i) => (
                  <div key={i} className={`relative overflow-hidden rounded-xl bg-ice ${l.photos.length <= 1 ? "col-span-2 aspect-[4/3]" : "aspect-square"}`}>
                    {p && <Image src={img(p, 400)} alt="" fill sizes="190px" className="object-cover" />}
                  </div>
                ))}
              </div>
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-extrabold">{l.name}</h2>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-muted"><MapPin className="size-3.5" />{l.address ?? "—"} · {l.micro_market ?? "—"}</p>
                  </div>
                  <span className="text-xs font-semibold text-muted">Submitted {when(l.updated_at, true)}</span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                  {[["Type", l.primary_type], ["Area", sqft(l.area_available)], ["Rent", l.rent_psf ? `₹${l.rent_psf}/sq ft` : "—"],
                    ["Clear height", l.clear_height_m ? `${l.clear_height_m} m` : "—"], ["Docks", l.docks ?? "—"], ["Power", l.power_kva ? `${l.power_kva} KVA` : "—"]].map(([k, v]) => (
                    <div key={k as string} className="rounded-xl bg-surface px-3 py-2"><dt className="text-[11px] font-semibold text-muted">{k}</dt><dd className="font-bold">{v ?? "—"}</dd></div>
                  ))}
                </dl>

                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${l.fire_noc ? "bg-mint/10 text-mint" : "bg-coral/10 text-coral"}`}>
                    <Flame className="size-3.5" /> {l.fire_noc ? `Fire NOC claimed, till ${when(l.fire_noc_expiry)}` : "No Fire NOC claimed"}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 ${l.photos.length >= 3 ? "bg-mint/10 text-mint" : "bg-amber/15 text-amber"}`}>{l.photos.length} photos</span>
                  {l.lat && <a target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${l.lat}&mlon=${l.lng}#map=17/${l.lat}/${l.lng}`}
                    className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-brand hover:underline"><MapPin className="size-3.5" /> Open map pin</a>}
                  <Link href={`/warehouse/${l.id}`} target="_blank" className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 hover:text-brand"><ExternalLink className="size-3.5" /> Full details</Link>
                </div>

                <p className="mt-3 text-sm text-muted">Owner: <b className="text-ink">{l.owner?.company_name ?? "—"}</b>{l.owner?.full_name ? ` · ${l.owner.full_name}` : ""}{l.owner?.phone ? ` · ${l.owner.phone}` : ""}</p>
                {l.description && <p className="mt-2 line-clamp-3 text-sm text-muted">{l.description}</p>}

                <div className="mt-5 flex flex-wrap items-start gap-2">
                  <ActionButton action={approveListing.bind(null, l.id)} className="!px-5 !py-2.5 !text-sm bg-mint text-white hover:brightness-110">
                    <ShieldCheck className="size-4" /> Approve & verify
                  </ActionButton>
                  <RequestChanges action={requestChanges.bind(null, l.id)} />
                </div>
                <p className="mt-3 flex items-center gap-1 text-[11px] text-muted"><Check className="size-3" /> The owner gets a notification either way.</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
