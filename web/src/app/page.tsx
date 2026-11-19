import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, Check, ClipboardCheck, Clock3, LayoutGrid, LocateFixed, MapPinned, ShieldCheck, Sparkles, Wallet, Zap } from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import { CARD_FIELDS, type CardListing, STORAGE_TYPES, img } from "@/lib/data";
import { HeroSearch } from "@/components/HeroSearch";
import { ListingCard } from "@/components/ListingCard";
import { LazyMap } from "@/components/LazyMap";
import { Footer } from "@/components/Footer";
import { getT } from "@/lib/i18n/server";
import { TYPE_KEY, type T } from "@/lib/i18n";

function greeting(t: T) {
  const h = Number(new Date().toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }));
  return t(h < 12 ? "home.morning" : h < 17 ? "home.afternoon" : "home.evening");
}

export default async function Home() {
  const [{ supabase, profile }, { t }] = await Promise.all([getSession(), getT()]);
  const [{ data: stats }, { data: featured }, { data: all }] = await Promise.all([
    supabase.rpc("platform_stats"),
    supabase.from("listings").select(CARD_FIELDS).eq("status", "live").order("verified", { ascending: false }).limit(6),
    supabase.from("listings").select("storage_types,flex_enabled,flex_rate_pallet").eq("status", "live"),
  ]);
  const s = (stats ?? { listings: 0, sqft: 0, markets: 0, verified: 0 }) as Record<string, number>;
  const listings = (featured ?? []) as CardListing[];
  const rows = (all ?? []) as { storage_types: string[]; flex_enabled: boolean; flex_rate_pallet: number | null }[];
  const count = (name: string) => rows.filter((r) => r.storage_types.includes(name)).length;
  const types = STORAGE_TYPES.map((x) => ({ ...x, n: count(x.name) })).sort((a, b) => b.n - a.n);
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
              {profile?.full_name ? <>{greeting(t)}, <b className="text-ink">{profile.full_name.split(" ")[0]}</b> 👋</> : <>{t("home.liveInPune", { n: s.listings })}</>}
            </p>
            <h1 className="mt-5 text-[2.9rem] font-extrabold leading-[1.04] tracking-[-0.035em] sm:text-7xl lg:text-[4.6rem]">
              {t("home.h1a")} <span className="hl">{t("home.h1b")}</span>
              <span className="mt-1 block font-serif text-[1.08em] font-normal italic leading-[1] tracking-normal text-brand">{t("home.h1c")}</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
              {t("home.lead")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/search" className="btn btn-primary btn-arrow !py-2 !pl-6 text-base">
                {t("home.explore")} <span className="bubble"><ArrowRight className="size-4" /></span>
              </Link>
              <Link href="/list-space" className="btn btn-ghost !px-6 !py-3.5 text-base">{t("home.listWarehouse")}</Link>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-muted">
              {[t("home.trust1"), t("home.trust2"), t("home.trust3")].map((x) => (
                <li key={x} className="inline-flex items-center gap-1.5">
                  <span className="grid size-5 place-items-center rounded-full bg-mint/15 text-mint"><Check className="size-3.5" strokeWidth={3} /></span>{x}
                </li>
              ))}
            </ul>
            <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
              {[
                [s.sqft >= 1000 ? `${Math.round(s.sqft / 1000)}K` : s.sqft, t("home.statSqft"), "text-brand"],
                [s.verified, t("home.statVerified"), "text-mint"],
                [s.markets, t("home.statMarkets"), "text-coral"],
              ].map(([v, l, c]) => (
                <div key={l as string}>
                  <dt className={`display text-4xl font-black ${c}`}>{v}</dt>
                  <dd className="text-sm font-semibold text-muted">{l}</dd>
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
                  {t("home.mapLive", { n: s.listings })}
                </span>
                <Link href="/search" aria-label={t("home.openMap")} className="pointer-events-auto grid size-11 place-items-center rounded-full bg-white shadow-[var(--shadow-soft)]"><LocateFixed className="size-5" /></Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CATEGORY TILES ================= */}
        <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
          <Head title={t("home.browseBy")} accent={t("home.storageNeed")} href="/search" viewAll={t("home.viewAll")} />
          <div className="fade-x no-scrollbar -mx-4 mt-6 flex gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
            <Link href="/search" className="flex w-36 shrink-0 flex-col justify-between gap-6 rounded-[1.6rem] bg-navy p-4 text-white shadow-[var(--shadow-lift)]">
              <span className="tile-icon bg-white/10"><LayoutGrid className="size-5" /></span>
              <span><b className="display block text-lg">{t("home.allSpaces")}</b><span className="text-xs text-ice/70">{t("home.listed", { n: s.listings })}</span></span>
            </Link>
            {types.map(({ name, icon: Icon, tint, n }) => (
              <Link key={name} href={`/search?type=${encodeURIComponent(name)}`}
                className="group flex w-36 shrink-0 flex-col justify-between gap-6 rounded-[1.6rem] border border-white bg-white/80 p-4 shadow-[var(--shadow-soft)] backdrop-blur transition hover:-translate-y-1">
                <span className={`tile-icon ${tint} transition group-hover:scale-110`}><Icon className="size-5" /></span>
                <span><b className="display block text-lg leading-tight">{t(TYPE_KEY[name])}</b><span className="text-xs text-muted">{n ? (n === 1 ? t("home.space1") : t("home.spaces", { n })) : t("home.comingSoon")}</span></span>
              </Link>
            ))}
          </div>
        </section>

        {/* ================= PROMO BANNER ================= */}
        <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6">
          <Link href="/search?flex=1" className="noise group relative grid overflow-hidden rounded-[2.25rem] bg-navy text-white sm:grid-cols-[1.1fr_1fr]">
            <div className="relative z-10 p-7 sm:p-10">
              <span className="eyebrow inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1.5 text-ink"><Zap className="size-3.5" /> {t("promo.tag")}</span>
              <h2 className="mt-5 text-4xl font-black leading-[0.95] sm:text-6xl">{t("promo.h1")}<br /><span className="font-serif font-normal italic text-lime">{t("promo.h2")}</span></h2>
              <p className="mt-4 max-w-sm text-ice/80">{t("promo.desc")}{Number.isFinite(flexFrom) ? <b className="text-white">{t("promo.from", { p: `₹${flexFrom}` })}</b> : null}.</p>
              <span className="mt-7 inline-flex items-center gap-2 font-bold">{t("promo.cta")} <span className="grid size-9 place-items-center rounded-full bg-white text-navy transition group-hover:translate-x-1"><ArrowRight className="size-4" /></span></span>
            </div>
            <div className="relative min-h-56">
              <Image src={img("https://images.unsplash.com/photo-1586528116493-a029325540fa", 1100)} alt="" fill sizes="(max-width:640px) 100vw, 45vw" className="object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/30 to-transparent sm:via-navy/10" />
              <span className="glass-dark absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"><Clock3 className="size-3.5" /> {t("promo.terms")}</span>
            </div>
          </Link>
        </section>

        {/* ================= AVAILABLE SPACES ================= */}
        <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
          <Head title={t("home.available")} accent={t("home.rightNow")} href="/search" viewAll={t("home.viewAll")} />
          <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto">
            {[[t("chip.recommended"), "/search", true], [t("chip.priceLow"), "/search?sort=price_asc"], [t("chip.largest"), "/search?sort=area_desc"], [t("chip.midc"), "/search?midc=1"], [t("chip.verified"), "/search?verified=1"]].map(([l, h, a]) => (
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
                <p className="flex items-center gap-2 font-extrabold"><BadgeCheck className="size-5 text-mint" /> {t("trust.report")}</p>
                <span className="rounded-full bg-mint/10 px-2.5 py-1 text-xs font-bold text-mint">{t("trust.passed")}</span>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {[t("trust.r1"), t("trust.r2"), t("trust.r3"), t("trust.r4")].map((x) => (
                  <li key={x} className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-full bg-mint text-[10px] text-white">✓</span>{x}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 lg:mt-0">
            <p className="eyebrow text-brand">{t("trust.eyebrow")}</p>
            <h2 className="mt-3 text-4xl font-black sm:text-6xl">{t("trust.h1")} <span className="font-serif font-normal italic text-brand">{t("trust.h2")}</span></h2>
            <p className="mt-4 text-lg text-muted">{t("trust.p")}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                [ClipboardCheck, t("trust.f1t"), t("trust.f1d"), "bg-brand/10 text-brand"],
                [ShieldCheck, t("trust.f2t"), t("trust.f2d"), "bg-mint/10 text-mint"],
                [Wallet, t("trust.f3t"), t("trust.f3d"), "bg-amber/15 text-amber"],
                [MapPinned, t("trust.f4t"), t("trust.f4d"), "bg-coral/10 text-coral"],
              ].map(([Icon, title, d, c]) => {
                const I = Icon as typeof ShieldCheck;
                return (
                  <div key={title as string} className="flex gap-3 rounded-[1.5rem] border border-white bg-white/80 p-4 shadow-[var(--shadow-soft)]">
                    <span className={`tile-icon shrink-0 ${c}`}><I className="size-5" /></span>
                    <div><p className="font-bold">{title as string}</p><p className="text-sm text-muted">{d as string}</p></div>
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
                <span className="eyebrow inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-ice"><Sparkles className="size-3.5" /> {t("owners.eyebrow")}</span>
                <h2 className="mt-5 text-4xl font-black leading-[0.95] sm:text-7xl">{t("owners.h1")} <span className="font-serif font-normal italic text-lime">{t("owners.h2")}</span> {t("owners.h3")}</h2>
                <p className="mt-5 max-w-lg text-lg text-ice/80">{t("owners.p")}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
                <Link href="/list-space" className="btn btn-lime btn-arrow !py-2 !pl-6 text-base">{t("owners.cta")} <span className="bubble !bg-ink/10"><ArrowUpRight className="size-4" /></span></Link>
                <Link href="/signup?role=owner" className="btn border border-white/25 !px-6 !py-3.5 text-base text-white hover:bg-white/10">{t("owners.create")}</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Head({ title, accent, href, viewAll }: { title: string; accent: string; href: string; viewAll: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-3xl font-black sm:text-5xl">{title} <span className="font-serif font-normal italic text-brand">{accent}</span></h2>
      <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-muted hover:text-brand">{viewAll} <ArrowRight className="size-4" /></Link>
    </div>
  );
}
