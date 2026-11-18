import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin, MoveVertical, Ruler, Truck, Warehouse, Zap } from "lucide-react";
import { type CardListing, img } from "@/lib/data";
import { FavoriteButton } from "./FavoriteButton";

const k = (n: number | null | undefined) => (n == null ? "—" : n >= 1000 ? `${(n / 1000).toFixed(n % 1000 ? 1 : 0)}K` : String(n));

/** Travel-app style card: framed photo, chips on the image, icon + name row, big price. */
export function ListingCard({ l, saved = false, priority = false }: { l: CardListing; saved?: boolean; priority?: boolean }) {
  return (
    <Link href={`/warehouse/${l.id}`}
      className="group block rounded-[2rem] border border-white bg-white/90 p-2.5 shadow-[var(--shadow-soft)] backdrop-blur transition duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.6rem]">
        <Image src={img(l.photos[0], 700)} alt={l.name} fill priority={priority}
          sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 30vw"
          className="object-cover transition duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-wrap gap-1.5">
            {l.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1.5 text-xs font-extrabold text-ink shadow">
                <BadgeCheck className="size-4 fill-mint text-white" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1.5 text-xs font-bold text-muted">In review</span>
            )}
            {l.flex_enabled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-lime px-2.5 py-1.5 text-xs font-extrabold text-ink">
                <Zap className="size-3.5" /> Flex
              </span>
            )}
          </div>
          <FavoriteButton id={l.id} initial={saved} dark />
        </div>
        <div className="absolute inset-x-3 bottom-3 flex gap-1.5 text-[11px] font-bold text-white">
          {[[Ruler, `${k(l.area_available)} sq ft`], [MoveVertical, l.clear_height_m ? `${l.clear_height_m} m` : null], [Truck, l.docks != null ? `${l.docks} docks` : null]]
            .filter(([, v]) => v).map(([I, v]) => {
              const Icon = I as typeof Ruler;
              return <span key={v as string} className="glass-dark inline-flex items-center gap-1 rounded-full px-2.5 py-1"><Icon className="size-3" />{v as string}</span>;
            })}
        </div>
      </div>
      <div className="flex items-center gap-3 px-2 pb-1.5 pt-3.5">
        <span className="tile-icon shrink-0 bg-surface text-navy"><Warehouse className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-lg font-extrabold leading-tight">{l.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted"><MapPin className="size-3.5 shrink-0" /><span className="line-clamp-1">{l.micro_market}</span></p>
        </div>
        <p className="shrink-0 text-right leading-none">
          <span className="display text-2xl font-black text-navy">₹{l.rent_psf ?? "—"}</span>
          <span className="block pt-1 text-[11px] font-semibold text-muted">/sq ft/mo</span>
        </p>
      </div>
    </Link>
  );
}
