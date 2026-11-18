import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/supabase/server";
import { CARD_FIELDS, type CardListing } from "@/lib/data";
import { ListingCard } from "@/components/ListingCard";
import { Filters } from "./Filters";
import { ResultsLayout } from "./ResultsLayout";

export const metadata: Metadata = { title: "Find warehouse space" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const p = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const { supabase, user } = await getSession();

  let q = supabase.from("listings").select(CARD_FIELDS).eq("status", "live");
  if (p("type")) q = q.contains("storage_types", [p("type")]);
  if (p("market")) q = q.ilike("micro_market", `%${p("market").replace(/[%_,()]/g, "")}%`);
  if (p("area")) q = q.gte("area_available", Number(p("area")) || 0);
  if (p("max_rent")) q = q.lte("rent_psf", Number(p("max_rent")) || 0);
  if (p("min_height")) q = q.gte("clear_height_m", Number(p("min_height")) || 0);
  if (p("min_docks")) q = q.gte("docks", Number(p("min_docks")) || 0);
  if (p("from")) q = q.lte("available_from", p("from"));
  if (p("midc")) q = q.eq("inside_midc", true);
  if (p("verified")) q = q.eq("verified", true);
  if (p("flex")) q = q.eq("flex_enabled", true);

  const sort = p("sort");
  q = sort === "price_asc" ? q.order("rent_psf", { ascending: true })
    : sort === "price_desc" ? q.order("rent_psf", { ascending: false })
    : sort === "area_desc" ? q.order("area_available", { ascending: false })
    : sort === "newest" ? q.order("created_at", { ascending: false })
    : q.order("verified", { ascending: false }).order("created_at", { ascending: false });

  const [{ data }, favs] = await Promise.all([
    q.limit(60),
    user ? supabase.from("favorites").select("listing_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
  ]);
  const listings = (data ?? []) as CardListing[];
  const saved = new Set((favs.data ?? []).map((f: { listing_id: string }) => f.listing_id));

  const pins = listings.filter((l) => l.lat && l.lng).map((l) => ({
    id: l.id, lat: l.lat!, lng: l.lng!, label: `₹${l.rent_psf}`, href: `/warehouse/${l.id}`, title: l.name,
  }));

  return (
    <main className="mx-auto max-w-[1600px] px-4 pb-28 pt-6 sm:px-6">
      <div className="mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
          Find the right warehouse <span className="font-serif font-normal italic text-brand">faster</span>
        </h1>
        <p className="mt-1 text-sm text-muted sm:text-base">Compare verified spaces by location, storage type, specs and price.</p>
      </div>
      <Filters count={listings.length} />
      <ResultsLayout pins={pins}>
        {listings.length ? (
          <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
            {listings.map((l, i) => <ListingCard key={l.id} l={l} saved={saved.has(l.id)} priority={i < 2} />)}
          </div>
        ) : (
          <div className="card grid place-items-center px-6 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-ice/60 text-brand"><SearchX className="size-6" /></span>
            <h2 className="mt-4 text-lg font-extrabold">No spaces match these filters</h2>
            <p className="mt-1 max-w-sm text-sm text-muted">Widen the area or price range, or try flexible short-term storage.</p>
            <div className="mt-5 flex gap-2">
              <Link href="/search" className="btn btn-ghost">Clear filters</Link>
              <Link href="/search?flex=1" className="btn btn-primary">Try flex storage</Link>
            </div>
          </div>
        )}
      </ResultsLayout>
    </main>
  );
}
