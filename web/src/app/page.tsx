import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, Check, ClipboardCheck, Clock3, LayoutGrid, LocateFixed, MapPinned, ShieldCheck, Sparkles, Wallet, Zap } from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import { CARD_FIELDS, type CardListing, STORAGE_TYPES, img } from "@/lib/data";
import { HeroSearch } from "@/components/HeroSearch";
import { ListingCard } from "@/components/ListingCard";
import { LazyMap } from "@/components/LazyMap";
import { Footer } from "@/components/Footer";

function greeting() {
  const h = Number(new Date().toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function Home() {
  const { supabase, profile } = await getSession();
  const [{ data: stats }, { data: featured }, { data: all }] = await Promise.all([
    supabase.rpc("platform_stats"),
    supabase.from("listings").select(CARD_FIELDS).eq("status", "live").order("verified", { ascending: false }).limit(6),
    supabase.from("listings").select("storage_types,flex_enabled,flex_rate_pallet").eq("status", "live"),
  ]);
  const s = (stats ?? { listings: 0, sqft: 0, markets: 0, verified: 0 }) as Record<string, number>;
  const listings = (featured ?? []) as CardListing[];
  const rows = (all ?? []) as { storage_types: string[]; flex_enabled: boolean; flex_rate_pallet: number | null }[];
  const count = (t: string) => rows.filter((r) => r.storage_types.includes(t)).length;
  const types = STORAGE_TYPES.map((t) => ({ ...t, n: count(t.name) })).sort((a, b) => b.n - a.n);
  const flexFrom = Math.min(...rows.filter((r) => r.flex_enabled && r.flex_rate_pallet).map((r) => Number(r.flex_rate_pallet)));
  const pins = listings.filter((l) => l.lat && l.lng).map((l) => ({ id: l.id, lat: l.lat!, lng: l.lng!, label: `₹${l.rent_psf}`, href: `/warehouse/${l.id}`, title: l.name }));

  return (
    <>
      <main>
        {/* ================= SEARCH (independent, top of page) ================= */}
        <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
          <HeroSearch count={s.listings} />
        </section>

        {/* ================= HERO ================= */}
        <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 pt-10 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:pt-14">
          <div className="rise">
            <p className="inline-flex items-center gap-2 rounded-full bg-white py-1.5 pl-2 pr-3.5 text-sm font-semibold text-muted shadow-sm ring-1 ring-line">
              <span className="relative flex size-2.5"><span className="absolute inset-0 animate-ping rounded-full bg-mint/60" /><span className="relative size-2.5 rounded-full bg-mint" /></span>
              {profile?.full_name ? <>{greeting()}, <b className="text-ink">{profile.full_name.split(" ")[0]}</b> 👋</> : <>{s.listings} verified spaces live in Pune</>}
            </p>
            <h1 className="mt-5 text-[2.9rem] font-extrabold leading-[1.04] tracking-[-0.035em] sm:text-7xl lg:text-[4.6rem]">
              Find your next <span className="hl">warehouse</span>
              <span className="mt-1 block font-serif text-[1.08em] font-normal italic leading-[1] tracking-normal text-brand">in days.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
              Physically verified warehouses, open yards and flex storage across Chakan, Talegaon and Pune. Real specs, true cost, quotes in 48 hours.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/search" className="btn btn-primary btn-arrow !py-2 !pl-6 text-base">
                Explore spaces <span className="bubble"><ArrowRight className="size-4" /></span>
              </Link>
              <Link href="/list-space" className="btn btn-ghost !px-6 !py-3.5 text-base">List your warehouse</Link>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-muted">
              {["Site-visited & verified", "True cost upfront", "Free for companies"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <span className="grid size-5 place-items-center rounded-full bg-mint/15 text-mint"><Check className="size-3.5" strokeWidth={3} /></span>{t}
                </li>
              ))}
            </ul>
            <dl className="mt-8 grid max-w-md grid-cols-3 divide-x divide-line rounded-[1.5rem] bg-white py-4 shadow-[var(--shadow-soft)] ring-1 ring-line">
              {[
                [s.sqft >= 1000 ? `${Math.round(s.sqft / 1000)}K` : s.sqft, "sq ft available", "text-brand"],
                [s.verified, "verified spaces", "text-mint"],
                [s.markets, "micro-markets", "text-coral"],
              ].map(([v, l, c]) => (
                <div key={l as string} className="px-4 text-center">
                  <dt className={`display text-3xl font-black ${c}`}>{v}</dt>
                  <dd className="mt-0.5 text-xs font-semibold text-muted">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Live map */}
          <div className="rise relative [animation-delay:120ms]">
            <div className="relative h-[380px] overflow-hidden rounded-[2.5rem] border-4 border-white bg-ice/40 shadow-[var(--shadow-lift)] sm:h-[500px]">
              <LazyMap pins={pins} controls={false} />
              <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-start justify-between p-4">
                <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-bold shadow-[var(--shadow-soft)]">
                  <span className="relative flex size-2.5"><span className="absolute inset-0 animate-ping rounded-full bg-coral/70" /><span className="relative size-2.5 rounded-full bg-coral" /></span>
                  {s.listings} spaces live near Pune
                </span>
                <Link href="/search" aria-label="Open full map" className="pointer-events-auto grid size-11 place-items-center rounded-full bg-white shadow-[var(--shadow-soft)]"><LocateFixed className="size-5" /></Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CATEGORY TILES ================= */}
        <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
          <Head title="Browse by" accent="storage need" href="/search" />
          <div className="fade-x no-scrollbar -mx-4 mt-6 flex gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
            <Link href="/search" className="flex w-36 shrink-0 flex-col justify-between gap-6 rounded-[1.6rem] bg-navy p-4 text-white shadow-[var(--shadow-lift)]">
              <span className="tile-icon bg-white/10"><LayoutGrid className="size-5" /></span>
              <span><b className="display block text-lg">All spaces</b><span className="text-xs text-ice/70">{s.listings} listed</span></span>
            </Link>
            {types.map(({ name, short, icon: Icon, tint, n }) => (
              <Link key={name} href={`/search?type=${encodeURIComponent(name)}`}
                className="group flex w-36 shrink-0 flex-col justify-between gap-6 rounded-[1.6rem] border border-white bg-white/80 p-4 shadow-[var(--shadow-soft)] backdrop-blur transition hover:-translate-y-1">
                <span className={`tile-icon ${tint} transition group-hover:scale-110`}><Icon className="size-5" /></span>
                <span><b className="display block text-lg leading-tight">{short}</b><span className="text-xs text-muted">{n ? `${n} space${n > 1 ? "s" : ""}` : "Coming soon"}</span></span>
              </Link>
            ))}
          </div>
        </section>

        {/* ================= PROMO BANNER ================= */}
        <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6">
          <Link href="/search?flex=1" className="noise group relative grid overflow-hidden rounded-[2.25rem] bg-navy text-white sm:grid-cols-[1.1fr_1fr]">
            <div className="relative z-10 p-7 sm:p-10">
              <span className="eyebrow inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1.5 text-ink"><Zap className="size-3.5" /> Flex storage</span>
              <h2 className="mt-5 text-4xl font-black leading-[0.95] sm:text-6xl">Store more.<br /><span className="font-serif font-normal italic text-lime">Commit less.</span></h2>
              <p className="mt-4 max-w-sm text-ice/80">Need space for a few months? Book by the pallet with no long lock-in{Number.isFinite(flexFrom) ? <>, from <b className="text-white">₹{flexFrom}/pallet/month</b></> : null}.</p>
              <span className="mt-7 inline-flex items-center gap-2 font-bold">See flex spaces <span className="grid size-9 place-items-center rounded-full bg-white text-navy transition group-hover:translate-x-1"><ArrowRight className="size-4" /></span></span>
            </div>
            <div className="relative min-h-56">
              <Image src={img("https://images.unsplash.com/photo-1586528116493-a029325540fa", 1100)} alt="" fill sizes="(max-width:640px) 100vw, 45vw" className="object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/30 to-transparent sm:via-navy/10" />
              <span className="glass-dark absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"><Clock3 className="size-3.5" /> 1–6 month terms</span>
            </div>
          </Link>
        </section>

        {/* ================= AVAILABLE SPACES ================= */}
        <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
          <Head title="Available" accent="right now" href="/search" />
          <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto">
            {[["✦ Recommended", "/search", true], ["Price: low to high", "/search?sort=price_asc"], ["Largest area", "/search?sort=area_desc"], ["Inside MIDC", "/search?midc=1"], ["Verified only", "/search?verified=1"]].map(([l, h, a]) => (
              <Link key={l as string} href={h as string} className="chip" data-active={!!a}>{l as string}</Link>
            ))}
          </div>
          <div className="no-scrollbar -mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {listings.map((l, i) => (
              <div key={l.id} className="w-[82%] shrink-0 snap-start sm:w-auto"><ListingCard l={l} priority={i < 3} /></div>
            ))}
          </div>
        </section>

        {/* ================= TRUST ================= */}
        <section id="trust" className="mx-auto mt-24 grid max-w-7xl scroll-mt-24 items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div className="relative">
            <div className="relative aspect-[5/4] overflow-hidden rounded-[2.5rem] border-4 border-white shadow-[var(--shadow-lift)]">
              <Image src={img("https://images.unsplash.com/photo-1616401784845-180882ba9ba8", 1200)} alt="Forklift inside a verified warehouse" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
            </div>
            <div className="glass absolute -bottom-6 left-4 right-4 rounded-[1.75rem] p-5 shadow-[var(--shadow-lift)] sm:left-auto sm:right-[-1rem] sm:w-80">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 font-extrabold"><BadgeCheck className="size-5 text-mint" /> Verification report</p>
                <span className="rounded-full bg-mint/10 px-2.5 py-1 text-xs font-bold text-mint">Passed</span>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {["Clear height measured on site", "Docks and levelers checked", "Fire NOC validity tracked", "Title & MIDC allotment reviewed"].map((x) => (
                  <li key={x} className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-full bg-mint text-[10px] text-white">✓</span>{x}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 lg:mt-0">
            <p className="eyebrow text-brand">Why tenants trust us</p>
            <h2 className="mt-3 text-4xl font-black sm:text-6xl">No fake listings. <span className="font-serif font-normal italic text-brand">Ever.</span></h2>
            <p className="mt-4 text-lg text-muted">Every Verified space has been visited, measured and document-checked by our field team.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                [ClipboardCheck, "Physical site visit", "GPS-tagged photos and measured specs", "bg-brand/10 text-brand"],
                [ShieldCheck, "Document checks", "Fire NOC, OC, title, MIDC allotment", "bg-mint/10 text-mint"],
                [Wallet, "Safe payments", "Token and deposit via a regulated partner", "bg-amber/15 text-amber"],
                [MapPinned, "Hyper-local", "Distances to NH-60, OEM plants, labour", "bg-coral/10 text-coral"],
              ].map(([Icon, t, d, c]) => {
                const I = Icon as typeof ShieldCheck;
                return (
                  <div key={t as string} className="flex gap-3 rounded-[1.5rem] border border-white bg-white/80 p-4 shadow-[var(--shadow-soft)]">
                    <span className={`tile-icon shrink-0 ${c}`}><I className="size-5" /></span>
                    <div><p className="font-bold">{t as string}</p><p className="text-sm text-muted">{d as string}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= OWNERS CTA ================= */}
        <section id="owners" className="mx-auto mt-28 max-w-7xl scroll-mt-24 px-4 sm:px-6">
          <div className="noise navy-glow relative overflow-hidden rounded-[2.5rem] px-6 py-14 text-white sm:px-14 sm:py-20">
            <div className="pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full bg-gradient-to-br from-sky/60 to-transparent blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 left-1/3 size-80 rounded-full bg-lime/20 blur-3xl" />
            <div className="relative grid items-end gap-8 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <span className="eyebrow inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-ice"><Sparkles className="size-3.5" /> For owners & developers</span>
                <h2 className="mt-5 text-4xl font-black leading-[0.95] sm:text-7xl">Fill your vacancy with <span className="font-serif font-normal italic text-lime">serious</span> tenants.</h2>
                <p className="mt-5 max-w-lg text-lg text-ice/80">Free to list. Get verified, receive GST-verified company leads, send quotes and track every deal from one dashboard.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
                <Link href="/list-space" className="btn btn-lime btn-arrow !py-2 !pl-6 text-base">List your space <span className="bubble !bg-ink/10"><ArrowUpRight className="size-4" /></span></Link>
                <Link href="/signup?role=owner" className="btn border border-white/25 !px-6 !py-3.5 text-base text-white hover:bg-white/10">Create owner account</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Head({ title, accent, href }: { title: string; accent: string; href: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-3xl font-black sm:text-5xl">{title} <span className="font-serif font-normal italic text-brand">{accent}</span></h2>
      <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-muted hover:text-brand">View all <ArrowRight className="size-4" /></Link>
    </div>
  );
}
