import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import { date, img, sqft } from "@/lib/data";
import { ReviewButtons } from "../dashboard/Actions";

export const metadata: Metadata = { title: "Admin · Verification queue" };

export default async function Admin() {
  const { supabase, profile } = await getSession();
  if (profile?.role !== "admin") redirect("/dashboard");
  const { data } = await supabase.from("listings")
    .select("id,name,micro_market,address,primary_type,area_available,rent_psf,clear_height_m,docks,fire_noc,fire_noc_expiry,photos,lat,lng,updated_at")
    .eq("status", "submitted").order("updated_at");
  const queue = data ?? [];

  return (
    <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Verification <span className="font-serif font-normal italic text-brand">queue</span></h1>
      <p className="mt-1 text-muted">{queue.length} listing{queue.length === 1 ? "" : "s"} waiting. Approve only after the site visit and document check.</p>
      <ul className="mt-8 space-y-4">
        {queue.map((l) => (
          <li key={l.id} className="card flex flex-col gap-4 p-4 sm:flex-row">
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl bg-ice sm:w-48">
              {l.photos[0] && <Image src={img(l.photos[0], 400)} alt="" fill sizes="192px" className="object-cover" />}
            </div>
            <div className="flex-1">
              <p className="text-lg font-extrabold">{l.name}</p>
              <p className="text-sm text-muted">{l.address} · {l.micro_market}</p>
              <p className="mt-2 text-sm">{l.primary_type} · {sqft(l.area_available)} · ₹{l.rent_psf}/sq ft · {l.clear_height_m} m · {l.docks} docks</p>
              <p className="mt-1 text-sm">Fire NOC: <b>{l.fire_noc ? `claimed, till ${date(l.fire_noc_expiry)}` : "not claimed"}</b> · {l.photos.length} photos ·{" "}
                {l.lat && <a className="font-bold text-brand" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${l.lat}&mlon=${l.lng}#map=17/${l.lat}/${l.lng}`}>Open pin</a>}</p>
              <div className="mt-3"><ReviewButtons id={l.id} /></div>
            </div>
          </li>
        ))}
        {!queue.length && (
          <li className="card grid place-items-center py-14 text-center"><ShieldCheck className="size-8 text-success" /><p className="mt-2 font-bold">Queue is clear</p>
            <Link href="/dashboard" className="btn btn-ghost mt-4">Back to dashboard</Link></li>
        )}
      </ul>
    </main>
  );
}
