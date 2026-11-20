import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { requireAdminPage } from "@/lib/admin";
import { signOut } from "@/app/actions";
import { AdminNav } from "./ui";

export const metadata: Metadata = { title: { default: "Admin console", template: "%s · Admin · Chakan MIDC Force" }, robots: { index: false } };

/** Separate admin area: own sidebar and top bar, no public header or phone bottom bar. Admins only. */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { supabase, profile, user } = await requireAdminPage();
  const head = { count: "exact", head: true } as const;
  const [listings, deals, visits] = await Promise.all([
    supabase.from("listings").select("id", head).eq("status", "submitted"),
    supabase.from("quotes").select("id", head).in("status", ["pending_review", "owner_quoted", "counter_review", "accepted"]),
    supabase.from("visits").select("id", head).in("status", ["pending_review", "owner_responded"]),
  ]);
  const counts = { pending: listings.count ?? 0, deals: deals.count ?? 0, visits: visits.count ?? 0 };
  const who = profile?.full_name || user?.email || "Admin";

  return (
    <div className="min-h-dvh bg-[#f3f6fd] lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      {/* Sidebar (desktop) */}
      <aside className="navy-glow sticky top-0 hidden h-dvh flex-col p-5 text-white lg:flex">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-2xl bg-lime text-ink"><ShieldCheck className="size-5" /></span>
          <span className="leading-tight"><b className="display block text-base">Admin console</b><span className="text-[11px] text-ice/70">Chakan MIDC Force</span></span>
        </Link>
        <div className="mt-8 flex-1"><Suspense><AdminNav counts={counts} variant="side" /></Suspense></div>
        <div className="space-y-2 border-t border-white/10 pt-4 text-sm">
          <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-ice/80 hover:bg-white/10 hover:text-white"><ExternalLink className="size-4" /> View website</Link>
          <div className="rounded-xl bg-white/5 px-3 py-2.5">
            <p className="truncate font-bold">{who}</p>
            <form action={signOut}><button className="mt-1 text-xs font-bold text-coral hover:underline">Sign out</button></form>
          </div>
        </div>
      </aside>

      {/* Top bar (phones and tablets) */}
      <header className="navy-glow sticky top-0 z-40 px-4 pt-3 text-white lg:hidden">
        <div className="flex items-center justify-between pb-3">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-lime text-ink"><ShieldCheck className="size-[18px]" /></span>
            <b className="display">Admin console</b>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/" aria-label="View website" className="grid size-9 place-items-center rounded-full hover:bg-white/10"><ExternalLink className="size-4" /></Link>
            <form action={signOut}><button className="rounded-full px-3 py-1.5 text-xs font-bold text-coral hover:bg-white/10">Sign out</button></form>
          </div>
        </div>
        <Suspense><AdminNav counts={counts} variant="tabs" /></Suspense>
      </header>

      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}
