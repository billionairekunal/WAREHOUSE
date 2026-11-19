import Link from "next/link";
import {
  Bell, CalendarClock, ClipboardCheck, FileText, Heart, LayoutDashboard, LogOut, Plus, UserRound, Warehouse,
} from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import { loadNav } from "@/lib/nav";
import { signOut } from "@/app/actions";
import { Logo } from "./Logo";
import { MenuCloser } from "./MenuCloser";

const navLink = "rounded-full px-4 py-2 transition hover:bg-white hover:text-ink";
const Count = ({ n, className = "" }: { n: number; className?: string }) =>
  n > 0 ? <span className={`absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full px-1 text-[11px] font-extrabold leading-5 ${className}`}>{n > 9 ? "9+" : n}</span> : null;

/** Role-aware header: visitors, companies, owners and admins each see what they need. */
export async function Header() {
  const { supabase, user, profile } = await getSession();
  const role = profile?.role ?? "tenant";
  const isOwner = role === "owner" || role === "admin";
  const nav = user ? await loadNav(supabase, user.id, role) : null;
  const initial = (profile?.full_name || user?.email || "?").slice(0, 1).toUpperCase();

  const links: [string, string][] = !user
    ? [["Find space", "/search"], ["Flex storage", "/search?flex=1"], ["Why us", "/#trust"], ["For owners", "/#owners"]]
    : isOwner
      ? [["Find space", "/search"], ["Why us", "/#trust"], ["My listings", "/dashboard?tab=listings"]]
      : [["Find space", "/search"], ["Flex storage", "/search?flex=1"], ["Why us", "/#trust"]];

  const menu: [string, string, typeof Heart][] = isOwner
    ? [["Dashboard", "/dashboard", LayoutDashboard], ["My listings", "/dashboard?tab=listings", Warehouse], ["Quote requests", "/dashboard?tab=requests", FileText],
       ["Site visits", "/dashboard?tab=visits", CalendarClock], ["Saved spaces", "/dashboard?tab=saved", Heart]]
    : [["Dashboard", "/dashboard", LayoutDashboard], ["My quotes", "/dashboard?tab=quotes", FileText], ["Site visits", "/dashboard?tab=visits", CalendarClock],
       ["Saved spaces", "/dashboard?tab=saved", Heart], ["List a space", "/list-space", Plus]];

  return (
    <header className="sticky top-0 z-40 px-4 pt-3 sm:px-6">
      <MenuCloser />
      <div className="glass mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full py-2 pl-3 pr-2 shadow-[var(--shadow-soft)]">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 text-sm font-semibold text-muted lg:flex">
          {links.map(([label, href]) => <Link key={href} href={href} className={navLink}>{label}</Link>)}
        </nav>

        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Link href="/list-space" className="btn btn-ghost hidden !py-2.5 md:inline-flex"><Plus className="size-4" /> List your space</Link>
              <Link href="/login" className="btn hidden !px-4 !py-2.5 text-ink hover:bg-white sm:inline-flex">Sign in</Link>
              <Link href="/signup" className="btn btn-primary !py-2.5"><UserRound className="size-4" /> <span className="hidden sm:inline">Sign up free</span><span className="sm:hidden">Sign up</span></Link>
            </>
          ) : (
            <>
              {role === "admin" && (
                <Link href="/admin" className="btn relative hidden bg-lime !py-2.5 text-ink hover:bg-lime-deep md:inline-flex">
                  <ClipboardCheck className="size-4" /> Approve listings
                  {nav!.pendingApprovals > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-navy px-1.5 text-[11px] leading-5 text-white">{nav!.pendingApprovals}</span>}
                </Link>
              )}
              {isOwner ? (
                <Link href="/list-space" className="btn btn-primary hidden !py-2.5 sm:inline-flex"><Plus className="size-4" /> List space</Link>
              ) : (
                <Link href="/dashboard?tab=saved" aria-label={`Saved spaces (${nav!.saved})`} title="Saved spaces"
                  className="relative hidden size-10 place-items-center rounded-full hover:bg-white sm:grid">
                  <Heart className="size-5" /><Count n={nav!.saved} className="bg-navy text-white" />
                </Link>
              )}

              {/* Alerts */}
              <details data-menu className="relative">
                <summary aria-label={`Alerts (${nav!.alerts.length})`}
                  className="relative grid size-10 cursor-pointer list-none place-items-center rounded-full hover:bg-white [&::-webkit-details-marker]:hidden">
                  <Bell className="size-5" /><Count n={nav!.alerts.length} className="bg-coral text-white" />
                </summary>
                <div className="card absolute -right-14 mt-3 w-[min(22rem,calc(100vw-2rem))] p-2 sm:right-0">
                  <p className="px-3 pb-1 pt-2 text-sm font-extrabold">Needs your attention</p>
                  {nav!.alerts.length ? (
                    <ul>
                      {nav!.alerts.slice(0, 6).map((a) => (
                        <li key={a.kind + a.id}>
                          <Link href={a.href} className="flex gap-3 rounded-xl px-3 py-2.5 hover:bg-surface">
                            <span className={`tile-icon size-9 shrink-0 ${a.kind === "quote" ? "bg-brand/10 text-brand" : "bg-mint/10 text-mint"}`}>
                              {a.kind === "quote" ? <FileText className="size-4" /> : <CalendarClock className="size-4" />}
                            </span>
                            <span className="min-w-0"><b className="block truncate text-sm">{a.text}</b><span className="block truncate text-xs text-muted">{a.sub}</span></span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="px-3 py-4 text-sm text-muted">You&apos;re all caught up. 🎉</p>}
                  <Link href="/dashboard" className="mt-1 block rounded-xl px-3 py-2 text-center text-sm font-bold text-brand hover:bg-surface">Open dashboard</Link>
                </div>
              </details>

              <Link href="/dashboard" className="btn btn-dark hidden !py-2.5 xl:inline-flex"><LayoutDashboard className="size-4" /> Dashboard</Link>

              {/* Account */}
              <details data-menu className="relative">
                <summary aria-label="Account menu"
                  className="grid size-10 cursor-pointer list-none place-items-center rounded-full bg-gradient-to-br from-sky to-royal text-sm font-bold text-white [&::-webkit-details-marker]:hidden">
                  {initial}
                </summary>
                <div className="card absolute right-0 mt-3 w-64 p-2 text-sm">
                  <div className="px-3 py-2">
                    <p className="truncate font-bold">{profile?.full_name || "Your account"}</p>
                    <p className="truncate text-xs text-muted">{profile?.company_name || user.email}</p>
                    <p className="mt-1.5 inline-block rounded-full bg-ice px-2 py-0.5 text-xs font-bold capitalize text-royal">{role === "tenant" ? "Company" : role}</p>
                  </div>
                  <hr className="my-1 border-line" />
                  {role === "admin" && (
                    <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2 font-semibold hover:bg-surface">
                      <ClipboardCheck className="size-4 text-mint" /> Approve listings
                      {nav!.pendingApprovals > 0 && <span className="ml-auto rounded-full bg-lime px-2 text-xs font-bold">{nav!.pendingApprovals}</span>}
                    </Link>
                  )}
                  {menu.map(([label, href, Icon]) => (
                    <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2 font-semibold hover:bg-surface">
                      <Icon className="size-4 text-muted" /> {label}
                      {label === "Saved spaces" && nav!.saved > 0 && <span className="ml-auto text-xs font-bold text-muted">{nav!.saved}</span>}
                    </Link>
                  ))}
                  <hr className="my-1 border-line" />
                  <form action={signOut}>
                    <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left font-semibold text-danger hover:bg-surface"><LogOut className="size-4" /> Sign out</button>
                  </form>
                </div>
              </details>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
