import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Search, UserRound } from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { CARD_FIELDS, type CardListing } from "@/lib/data";
import { ListingCard } from "@/components/ListingCard";

export const metadata: Metadata = { title: "Wishlist" };

/** Wishlist: works for everyone. Signed-out visitors and empty lists get a friendly empty state. */
export default async function SavedPage() {
  const [{ supabase, user }, { t }] = await Promise.all([getSession(), getT()]);
  const saved = user
    ? (((await supabase.from("favorites").select(`listing:listings(${CARD_FIELDS})`).eq("user_id", user.id).order("created_at", { ascending: false })).data ?? []) as unknown as { listing: CardListing | null }[])
        .map((f) => f.listing).filter((l): l is CardListing => !!l)
    : [];

  return (
    <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6">
      <h1 className="text-3xl font-black sm:text-5xl">{t("saved.title")} <span className="font-serif font-normal italic text-brand">{t("saved.titleB")}</span></h1>
      <p className="mt-1 text-muted">{t("saved.sub")}</p>

      {saved.length ? (
        <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5">
          {saved.map((l, i) => <ListingCard key={l.id} l={l} saved priority={i < 2} />)}
        </div>
      ) : (
        <div className="mt-8 grid place-items-center rounded-[2rem] bg-white px-6 py-14 text-center shadow-[var(--shadow-soft)] ring-1 ring-line">
          <span className="grid size-16 place-items-center rounded-full bg-coral/10 text-coral"><Heart className="size-7" /></span>
          <h2 className="mt-5 text-xl font-extrabold">{t("saved.empty")}</h2>
          <p className="mt-2 max-w-sm text-sm text-muted">{user ? t("saved.emptyD") : t("saved.signinD")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/search" className="btn btn-primary"><Search className="size-4" /> {t("saved.browse")}</Link>
            {!user && <Link href="/login?next=/saved" className="btn btn-ghost"><UserRound className="size-4" /> {t("nav.signIn")}</Link>}
          </div>
        </div>
      )}
    </main>
  );
}
