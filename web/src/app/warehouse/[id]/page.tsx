import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, ArrowRight, BadgeCheck, Building2, CalendarDays, Car, CheckCircle2, Container, Flame, Gauge, Layers,
  MapPin, MoveVertical, Plane, Plug, Route, ShieldAlert, ShieldCheck, Square, TrainFront, Truck, Warehouse, Zap,
} from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import { CARD_FIELDS, type CardListing, type Listing, date, sqft } from "@/lib/data";
import { Gallery } from "./Gallery";
import { RequestPanel } from "./RequestPanel";
import { MiniMap } from "./MiniMap";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ListingCard } from "@/components/ListingCard";
import { Footer } from "@/components/Footer";

async function load(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { supabase, user } = await getSession();
  const { data } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  return { supabase, user, l: data as Listing | null };
}

export async function generateMetadata({ params }: PageProps<"/warehouse/[id]">): Promise<Metadata> {
  const r = await load((await params).id);
  return r?.l ? { title: `${r.l.name}, ${r.l.micro_market}`, description: r.l.description ?? undefined } : {};
}

export default async function WarehousePage({ params }: PageProps<"/warehouse/[id]">) {
  const r = await load((await params).id);
  if (!r?.l) notFound();
  const { l, supabase, user } = r;

  const [fav, similar] = await Promise.all([
    user ? supabase.from("favorites").select("listing_id").eq("user_id", user.id).eq("listing_id", l.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("listings").select(CARD_FIELDS).eq("status", "live").neq("id", l.id).overlaps("storage_types", l.storage_types).limit(3),
  ]);

  const specs = [
    { icon: Square, k: "Available", v: sqft(l.area_available), c: "bg-brand/10 text-brand" },
    { icon: MoveVertical, k: "Clear height", v: l.clear_height_m ? `${l.clear_height_m} m` : "—", c: "bg-coral/10 text-coral" },
    { icon: Truck, k: "Docks", v: l.docks != null ? `${l.docks}${l.dock_levelers ? " + levelers" : ""}` : "—", c: "bg-amber/15 text-amber" },
    { icon: Gauge, k: "Floor load", v: l.floor_load_mt ? `${l.floor_load_mt} MT/sqm` : "—", c: "bg-violet/10 text-violet" },
    { icon: Plug, k: "Power", v: l.power_kva ? `${l.power_kva} KVA` : "—", c: "bg-mint/10 text-mint" },
    { icon: Layers, k: "Flooring", v: l.flooring ?? "—", c: "bg-sky/15 text-sky" },
  ];

  const details: [string, string | number | null | undefined][] = [
    ["Building type", l.building_type], ["Grade", l.grade], ["Total built-up", sqft(l.area_total)],
    ["Min. divisible area", sqft(l.area_min)], ["Eave height", l.eave_height_m ? `${l.eave_height_m} m` : null],
    ["Truck parking", l.truck_parking], ["Office area", l.office_sqft ? sqft(l.office_sqft) : null],
    ["Power backup", l.power_backup], ["Fire safety", l.fire_safety],
    ["Security deposit", l.deposit_months ? `${l.deposit_months} months` : null],
    ["Lock-in", l.lock_in_months ? `${l.lock_in_months} months` : null],
    ["Escalation", l.escalation_pct ? `${l.escalation_pct}% yearly` : null],
    ["Available from", date(l.available_from)],
  ];

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 pb-32 pt-5 sm:px-6 lg:pb-10">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/search" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="size-4" /> Back to search</Link>
          <FavoriteButton id={l.id} initial={!!fav.data} className="border border-line" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0">
            <Gallery photos={l.photos} name={l.name}>
              <p className="eyebrow text-ice/90">{[l.grade && `Grade ${l.grade}`, l.building_type, l.micro_market].filter(Boolean).join(" · ")}</p>
              <h1 className="mt-2 text-[2.6rem] font-black leading-[0.92] tracking-[-0.05em] sm:text-7xl">{l.name}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ice"><MapPin className="size-4" /> {l.address ?? l.micro_market}</span>
                {l.storage_types.slice(0, 2).map((t) => <span key={t} className="glass-dark rounded-full px-3 py-1 text-xs font-bold">{t}</span>)}
              </div>
            </Gallery>

            {/* Trust bar */}
            <div className="mt-5 flex items-center justify-between gap-3 rounded-[1.6rem] border border-white bg-white/90 p-3 pr-4 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-3">
                <span className={`grid size-11 place-items-center rounded-2xl ${l.verified ? "bg-success/15 text-success" : "bg-warn/15 text-warn"}`}>
                  {l.verified ? <ShieldCheck className="size-5" /> : <ShieldAlert className="size-5" />}
                </span>
                <div>
                  <p className="font-bold">{l.verified ? "Verified by Chakan MIDC Force" : "Verification in progress"}</p>
                  <p className="text-sm text-muted">{l.verified ? "Site visited, specs measured, documents reviewed" : "Documents are being reviewed by our team"}</p>
                </div>
              </div>
              <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-extrabold ${l.verified ? "bg-mint/10 text-mint" : "bg-amber/15 text-amber"}`}>{l.verified ? <><BadgeCheck className="size-4" /> Verified</> : "In review"}</span>
            </div>

            {/* Spec tiles */}
            <section className="mt-8">
              <div className="flex items-end justify-between"><h2 className="text-3xl font-black">Specifications</h2><a href="#details" className="text-sm font-bold text-muted hover:text-brand">View all →</a></div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {specs.map(({ icon: Icon, k, v, c }) => (
                  <div key={k} className="rounded-[1.6rem] border border-white bg-white/90 p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5">
                    <span className={`tile-icon ${c}`}><Icon className="size-5" /></span>
                    <p className="mt-4 text-xs font-semibold text-muted">{k}</p>
                    <p className="display text-xl font-black">{v}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Flags */}
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                [l.inside_midc, Building2, "Inside MIDC zone"],
                [l.container_40ft, Container, "40-ft container access"],
                [l.fire_noc, Flame, l.fire_noc_expiry ? `Fire NOC till ${date(l.fire_noc_expiry)}` : "Fire NOC available"],
                [l.flex_enabled, Zap, l.flex_rate_pallet ? `Flex storage ₹${l.flex_rate_pallet}/pallet/mo` : "Flex storage"],
              ].filter(([on]) => on).map(([, Icon, t]) => {
                const I = Icon as typeof Zap;
                return <span key={t as string} className="chip !border-white !bg-white/90 !py-2.5 shadow-[var(--shadow-soft)]"><span className="grid size-6 place-items-center rounded-full bg-lime"><I className="size-3.5 text-ink" /></span>{t as string}</span>;
              })}
            </div>

            {l.description && (
              <section className="mt-8">
                <h2 className="text-3xl font-black">About this space</h2>
                <p className="mt-3 leading-relaxed text-muted">{l.description}</p>
              </section>
            )}

            <section className="mt-8">
              <h2 id="details" className="scroll-mt-24 text-3xl font-black">Building & commercials</h2>
              <dl className="card mt-4 grid gap-x-8 !rounded-3xl p-5 sm:grid-cols-2">
                {details.filter(([, v]) => v != null && v !== "—").map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-line py-3 text-sm last:border-0 sm:[&:nth-last-child(2)]:border-0">
                    <dt className="text-muted">{k}</dt><dd className="text-right font-bold">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {l.amenities.length > 0 && (
              <section className="mt-8">
                <h2 className="text-3xl font-black">Amenities</h2>
                <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {l.amenities.map((a) => <li key={a} className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="size-4 text-success" />{a}</li>)}
                </ul>
              </section>
            )}

            <section className="mt-8">
              <h2 className="text-3xl font-black">Location & connectivity</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                {[[Route, "Highway", l.dist_highway_km], [Plane, "Airport", l.dist_airport_km], [TrainFront, "Railway", l.dist_railway_km], [Car, "Road width", l.road_width_ft]].map(([Icon, k, v], n) => {
                  const I = Icon as typeof Route;
                  return (
                    <div key={k as string} className="rounded-3xl border border-line bg-white p-4">
                      <I className="size-5 text-brand" />
                      <p className="mt-2 text-xs font-semibold text-muted">{k as string}</p>
                      <p className="font-extrabold">{v != null ? `${v} ${n === 3 ? "ft" : "km"}` : "—"}</p>
                    </div>
                  );
                })}
              </div>
              {l.landmarks.length > 0 && (
                <p className="mt-4 text-sm text-muted">Near: <b className="text-ink">{l.landmarks.join(" · ")}</b></p>
              )}
              {l.lat && l.lng && (
                <div className="mt-4 h-72 overflow-hidden rounded-[1.75rem] border border-line">
                  <MiniMap lat={l.lat} lng={l.lng} label={l.name} />
                </div>
              )}
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <RequestPanel l={l} loggedIn={!!user} isOwner={user?.id === l.owner_id} />
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted"><Warehouse className="size-3.5" /> Listed {date(l.created_at)} · <CalendarDays className="size-3.5" /> Available {date(l.available_from)}</p>
          </aside>
        </div>

        {(similar.data?.length ?? 0) > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-extrabold tracking-tight">Similar spaces</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(similar.data as CardListing[]).map((s) => <ListingCard key={s.id} l={s} />)}
            </div>
          </section>
        )}
      </main>

      {/* Mobile sticky CTA */}
      <div className="glass fixed inset-x-3 bottom-3 z-50 flex items-center justify-between gap-3 rounded-[1.75rem] p-2 pl-5 shadow-[var(--shadow-lift)] lg:hidden">
        <p className="leading-none"><span className="text-[11px] font-semibold text-muted">Price</span><br /><b className="display text-2xl font-black text-navy">₹{l.rent_psf}</b><span className="text-xs font-semibold text-muted"> /sq ft/mo</span></p>
        <a href="#request" className="btn btn-primary btn-arrow !py-2 !pl-5">Get quote <span className="bubble"><ArrowRight className="size-4" /></span></a>
      </div>
      <Footer />
    </>
  );
}
