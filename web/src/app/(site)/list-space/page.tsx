import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession, profileDone } from "@/lib/supabase/server";
import { Wizard } from "./Wizard";

export const metadata: Metadata = { title: "List your space" };

export default async function ListSpacePage({ searchParams }: PageProps<"/list-space">) {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect("/login?next=/list-space");
  if (!profileDone(profile)) redirect("/onboarding?next=/list-space");
  const id = (await searchParams).id;
  let initial;
  if (typeof id === "string") {
    const { data } = await supabase.from("listings").select("*").eq("id", id).eq("owner_id", user.id).maybeSingle();
    if (data) initial = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null));
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:px-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="size-4" /> Back to dashboard</Link>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">
        {initial ? "Edit your" : "List a new"} <span className="font-serif font-normal italic text-brand">space</span>
      </h1>
      <p className="mt-2 text-muted">Seven quick steps. Your progress is saved whenever you click Save draft.</p>
      <div className="mt-8"><Wizard userId={user.id} initial={initial as never} /></div>
    </main>
  );
}
