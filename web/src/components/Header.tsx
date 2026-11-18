import Link from "next/link";
import { getSession } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { Logo } from "./Logo";

const LINKS = [
  ["Find space", "/search"],
  ["List space", "/list-space"],
  ["How it works", "/#how"],
];

/** Plain top bar: logo, three links, and one account button. */
export async function Header() {
  const { user, profile } = await getSession();
  const initial = (profile?.full_name || user?.email || "?").slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-8 text-[15px] font-semibold text-muted md:flex">
          {LINKS.map(([label, href]) => (
            <Link key={href} href={href} className="transition hover:text-ink">{label}</Link>
          ))}
        </nav>

        {user ? (
          <details className="relative">
            <summary aria-label="Account menu"
              className="grid size-10 cursor-pointer list-none place-items-center rounded-full bg-navy text-sm font-bold text-white [&::-webkit-details-marker]:hidden">
              {initial}
            </summary>
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-white p-2 text-sm shadow-[var(--shadow-lift)]">
              <p className="truncate px-3 py-2 text-xs text-muted">{user.email}</p>
              <Link href="/dashboard" className="block rounded-xl px-3 py-2 font-semibold hover:bg-surface">Dashboard</Link>
              <Link href="/dashboard?tab=saved" className="block rounded-xl px-3 py-2 font-semibold hover:bg-surface">Saved spaces</Link>
              {profile?.role === "admin" && <Link href="/admin" className="block rounded-xl px-3 py-2 font-semibold hover:bg-surface">Approve listings</Link>}
              <form action={signOut}>
                <button className="w-full rounded-xl px-3 py-2 text-left font-semibold text-danger hover:bg-surface">Sign out</button>
              </form>
            </div>
          </details>
        ) : (
          <Link href="/login" className="rounded-full bg-navy px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand">Sign in</Link>
        )}
      </div>
    </header>
  );
}
