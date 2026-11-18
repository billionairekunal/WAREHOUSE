import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, MoveVertical, Ruler, Truck, Zap } from "lucide-react";
import { type CardListing, img } from "@/lib/data";
import { FavoriteButton } from "./FavoriteButton";

const area = (n: number | null | undefined) =>
  n == null ? "—" : n >= 1000 ? `${Number((n / 1000).toFixed(1))}K` : String(n);

/** Listing card: clean photo, full name, and the three key specs in readable tiles below the photo. */
export function ListingCard({ l, saved = false, priority = false }: { l: CardListing; saved?: boolean; priority?: boolean }) {
  const specs = [
    { icon: Ruler, label: "Sq ft", value: area(l.area_available), tint: "text-brand" },
    { icon: MoveVertical, label: "Height", value: l.clear_height_m != null ? `${l.clear_height_m} m` : "—", tint: "text-coral" },
    { icon: Truck, label: "Docks", value: l.docks != null ? String(l.docks) : "—", tint: "text-amber" },
  ];

  return (
    <Link href={`/warehouse/${l.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white bg-white shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      {/* Photo */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image src={img(l.photos[0], 700)} alt={l.name} fill priority={priority}
          sizes="(max-width: 640px) 90vw, (max-width: 1280px) 45vw, 30vw"
          className="object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-wrap gap-1.5">
            {l.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-ink shadow-sm">
                <BadgeCheck className="size-4 fill-mint text-white" /> Verified
              </span>
            ) : (
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-muted">In review</span>
            )}
            {l.flex_enabled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-lime px-2.5 py-1 text-xs font-bold text-ink">
                <Zap className="size-3.5" /> Flex
              </span>
            )}
          </div>
          <FavoriteButton id={l.id} initial={saved} />
        </div>
        {l.primary_type && (
          <span className="absolute bottom-3 left-3 rounded-full bg-navy/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            {l.primary_type}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-lg font-extrabold leading-snug" title={l.name}>{l.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted">
          <MapPin className="size-4 shrink-0" /><span className="truncate">{l.micro_market}, {l.city}</span>
        </p>

        <dl className="mb-4 mt-4 grid grid-cols-3 gap-2">
          {specs.map(({ icon: Icon, label, value, tint }) => (
            <div key={label} className="rounded-xl bg-surface px-2.5 py-2">
              <dt className="flex items-center gap-1 text-[11px] font-semibold text-muted"><Icon className={`size-3.5 ${tint}`} />{label}</dt>
              <dd className="mt-0.5 whitespace-nowrap text-sm font-extrabold">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-3.5">
          <p className="leading-none">
            <span className="display text-2xl font-black text-navy">₹{l.rent_psf ?? "—"}</span>
            <span className="text-sm font-semibold text-muted"> /sq ft/mo</span>
          </p>
          <span className="inline-flex items-center gap-1 rounded-full bg-navy px-3.5 py-2 text-xs font-bold text-white transition group-hover:bg-brand">
            View <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
