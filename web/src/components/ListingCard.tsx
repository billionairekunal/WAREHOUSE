import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, MapPin, MoveVertical, Ruler, Truck, Zap } from "lucide-react";
import { type CardListing, img } from "@/lib/data";
import { FavoriteButton } from "./FavoriteButton";
import { getT } from "@/lib/i18n/server";
import { TYPE_KEY } from "@/lib/i18n";

const area = (n: number | null | undefined) =>
  n == null ? "—" : n >= 1000 ? `${Number((n / 1000).toFixed(1))}K` : String(n);

/** Listing card: framed photo with badges, name + location, one spec strip, price and a round arrow. */
export async function ListingCard({ l, saved = false, priority = false }: { l: CardListing; saved?: boolean; priority?: boolean }) {
  const { t, lang } = await getT();
  const specs = [
    { icon: Ruler, label: t("c.sqft"), value: area(l.area_available), tint: "bg-brand/10 text-brand" },
    { icon: MoveVertical, label: t("c.height"), value: l.clear_height_m != null ? `${l.clear_height_m} m` : "—", tint: "bg-coral/10 text-coral" },
    { icon: Truck, label: t("c.docks"), value: l.docks != null ? String(l.docks) : "—", tint: "bg-amber/15 text-amber" },
  ];
  const type = l.primary_type ? (lang !== "en" && TYPE_KEY[l.primary_type] ? t(TYPE_KEY[l.primary_type]) : l.primary_type) : null;

  return (
    <Link href={`/warehouse/${l.id}`}
      className="group relative flex h-full flex-col rounded-[2rem] bg-white p-2 shadow-[var(--shadow-soft)] ring-1 ring-line/70 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] hover:ring-sky/40">
      {/* Framed photo */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.6rem]">
        <Image src={img(l.photos[0], 700)} alt={l.name} fill priority={priority}
          sizes="(max-width: 640px) 90vw, (max-width: 1280px) 45vw, 30vw"
          className="object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/55 via-transparent to-navy/10" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-wrap gap-1.5">
            {l.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink shadow-sm backdrop-blur">
                <BadgeCheck className="size-4 fill-mint text-white" /> {t("c.verified")}
              </span>
            ) : (
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-muted">{t("c.review")}</span>
            )}
            {l.flex_enabled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-lime px-2.5 py-1 text-xs font-bold text-ink shadow-sm">
                <Zap className="size-3.5" /> {t("c.flex")}
              </span>
            )}
          </div>
          <FavoriteButton id={l.id} initial={saved} className="shadow-sm" />
        </div>
        {type && (
          <span className="glass-dark absolute bottom-3 left-3 rounded-full px-3 py-1 text-xs font-semibold text-white">{type}</span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col px-2.5 pb-1.5 pt-3.5">
        <h3 className="line-clamp-2 text-[17px] font-bold leading-snug tracking-[-0.01em] text-ink" title={l.name}>{l.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted">
          <MapPin className="size-3.5 shrink-0 text-brand" /><span className="truncate">{l.micro_market}, {l.city}</span>
        </p>

        <dl className="mt-3.5 grid grid-cols-3 divide-x divide-line rounded-2xl bg-surface py-2.5">
          {specs.map(({ icon: Icon, label, value, tint }) => (
            <div key={label} className="flex flex-col items-center gap-1 px-1 text-center">
              <span className={`grid size-7 place-items-center rounded-full ${tint}`}><Icon className="size-3.5" /></span>
              <dt className="order-last text-[11px] font-semibold leading-none text-muted">{label}</dt>
              <dd className="whitespace-nowrap text-[15px] font-extrabold leading-none text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-auto flex items-center justify-between gap-3 pt-3.5">
          <p className="leading-tight">
            <span className="display text-[1.6rem] font-black text-navy">₹{l.rent_psf ?? "—"}</span>
            <span className="ml-1 text-sm font-semibold text-muted">{t("c.perMo")}</span>
          </p>
          <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-navy text-white transition duration-300 group-hover:bg-brand group-hover:shadow-[var(--shadow-glow)]">
            <ArrowUpRight className="size-5 transition duration-300 group-hover:rotate-45" />
          </span>
          <span className="sr-only">{t("c.view")}</span>
        </div>
      </div>
    </Link>
  );
}
