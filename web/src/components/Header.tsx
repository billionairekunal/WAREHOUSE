import Link from "next/link";
import { Heart, LayoutDashboard, Plus, UserRound } from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { Logo } from "./Logo";

export async function Header() {
  const { user, profile } = await getSession();
  const initials = (profile?.full_name || user?.email || "?").slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-40 px-4 pt-3 sm:px-6">
      <div className="glass mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full py-2 pl-3 pr-2 shadow-[var(--shadow-soft)]">
        <Logo />
        <nav className="hidden items-center gap-1 text-sm font-semibold text-muted md:flex">
          <Link href="/search" className="rounded-full px-4 py-2 hover:bg-white hover:text-ink">Find space</Link>
          <Link href="/search?flex=1" className="rounded-full px-4 py-2 hover:bg-white hover:text-ink">Flex storage</Link>
          <Link href="/#how" className="rounded-full px-4 py-2 hover:bg-white hover:text-ink">How it works</Link>
          <Link href="/#owners" className="rounded-full px-4 py-2 hover:bg-white hover:text-ink">For owners</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/list-space" className="btn btn-ghost hidden !py-2.5 sm:inline-flex">
            <Plus className="size-4" /> List space
          </Link>
          {user ? (
            <>
              <Link href="/dashboard?tab=saved" aria-label="Saved spaces" title="Saved spaces"
                className="hidden size-10 place-items-center rounded-full hover:bg-white sm:grid">
                <Heart className="size-5" />
              </Link>
              <Link href="/dashboard" className="btn btn-dark hidden !py-2.5 sm:inline-flex">
                <LayoutDashboard className="size-4" /> Dashboard
              </Link>
              <details className="relative">
                <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-full bg-gradient-to-br from-sky to-royal text-sm font-bold text-white" aria-label="Account menu">
                  {initials}
                </summary>
                <div className="card absolute right-0 mt-2 w-60 p-2 text-sm">
                  <div className="px-3 py-2">
                    <p className="font-bold">{profile?.full_name || "Your account"}</p>
                    <p className="truncate text-muted">{user.email}</p>
                    <p className="mt-1 inline-block rounded-full bg-ice px-2 py-0.5 text-xs font-bold capitalize text-royal">{profile?.role}</p>
                  </div>
                  <Link href="/dashboard" className="block rounded-xl px-3 py-2 hover:bg-surface">Dashboard</Link>
                  {profile?.role === "admin" && <Link href="/admin" className="block rounded-xl px-3 py-2 hover:bg-surface">Admin console</Link>}
                  <form action={signOut}>
                    <button className="w-full rounded-xl px-3 py-2 text-left text-danger hover:bg-surface">Sign out</button>
                  </form>
                </div>
              </details>
            </>
          ) : (
            <Link href="/login" className="btn btn-dark !py-2.5">
              <UserRound className="size-4" /> Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
