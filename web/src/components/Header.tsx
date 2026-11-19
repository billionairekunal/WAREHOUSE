import Link from "next/link";
import {
  Bell, CalendarClock, ClipboardCheck, FileText, Heart, LayoutDashboard, LogOut, Plus, UserRound, Warehouse,
} from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import { loadNav } from "@/lib/nav";
import { signOut } from "@/app/actions";
import { Logo } from "./Logo";
import { MenuCloser } from "./MenuCloser";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { getT } from "@/lib/i18n/server";
import { DATE_LOCALE } from "@/lib/i18n";

const navLink = "rounded-full px-4 py-2 transition hover:bg-white hover:text-ink";
const Count = ({ n, className = "" }: { n: number; className?: string }) =>
  n > 0 ? <span className={`absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full px-1 text-[11px] font-extrabold leading-5 ${className}`}>{n > 9 ? "9+" : n}</span> : null;

/** Role-aware header: visitors, companies, owners and admins each see what they need. */
export async function Header() {
  const [{ supabase, user, profile }, { t, lang }] = await Promise.all([getSession(), getT()]);
  const role = profile?.role ?? "tenant";
  const isOwner = role === "owner" || role === "admin";
  const nav = user ? await loadNav(supabase, user.id, role, t, DATE_LOCALE[lang]) : null;
  const initial = (profile?.full_name || user?.email || "?").slice(0, 1).toUpperCase();

  const links: [string, string][] = !user
    ? [[t("nav.findSpace"), "/search"], [t("nav.flex"), "/search?flex=1"], [t("nav.forOwners"), "/#owners"]]
    : isOwner
      ? [[t("nav.findSpace"), "/search"], [t("nav.myListings"), "/dashboard?tab=listings"]]
      : [[t("nav.findSpace"), "/search"], [t("nav.flex"), "/search?flex=1"]];

  const menu: [string, string, typeof Heart][] = isOwner
    ? [[t("nav.dashboard"), "/dashboard", LayoutDashboard], [t("nav.myListings"), "/dashboard?tab=listings", Warehouse], [t("nav.quoteRequests"), "/dashboard?tab=requests", FileText],
       [t("nav.siteVisits"), "/dashboard?tab=visits", CalendarClock], [t("nav.saved"), "/dashboard?tab=saved", Heart]]
    : [[t("nav.dashboard"), "/dashboard", LayoutDashboard], [t("nav.myQuotes"), "/dashboard?tab=quotes", FileText], [t("nav.siteVisits"), "/dashboard?tab=visits", CalendarClock],
       [t("nav.saved"), "/dashboard?tab=saved", Heart], [t("nav.listASpace"), "/list-space", Plus]];

  return (
    <header className="sticky top-0 z-40 px-4 pt-3 sm:px-6">
      <MenuCloser />
      <div className="glass mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full py-2 pl-3 pr-2 shadow-[var(--shadow-soft)]">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 text-sm font-semibold text-muted lg:flex">
          {links.map(([label, href]) => <Link key={href} href={href} className={navLink}>{label}</Link>)}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          {!user ? (
            <>
              <Link href="/list-space" className="btn btn-ghost hidden !py-2.5 md:inline-flex"><Plus className="size-4" /> {t("nav.listYourSpace")}</Link>
              <Link href={`/login?next=${encodeURIComponent("/dashboard?tab=saved")}`} aria-label={t("nav.saved")} title={t("nav.saved")}
                className="hidden size-10 place-items-center rounded-full hover:bg-white sm:grid"><Heart className="size-5" /></Link>
              <Link href="/login" className="btn hidden !px-4 !py-2.5 text-ink hover:bg-white sm:inline-flex">{t("nav.signIn")}</Link>
              <Link href="/signup" aria-label={t("nav.signUpFree")} className="btn btn-primary !size-10 !p-0 sm:!size-auto sm:!px-5 sm:!py-2.5"><UserRound className="size-4" /> <span className="hidden sm:inline">{t("nav.signUpFree")}</span></Link>
            </>
          ) : (
            <>
              {role === "admin" && (
                <Link href="/admin" className="btn relative hidden bg-lime !py-2.5 text-ink hover:bg-lime-deep md:inline-flex">
                  <ClipboardCheck className="size-4" /> {t("nav.approve")}
                  {nav!.pendingApprovals > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-navy px-1.5 text-[11px] leading-5 text-white">{nav!.pendingApprovals}</span>}
                </Link>
              )}
              {isOwner && (
                <Link href="/list-space" className="btn btn-primary hidden !py-2.5 sm:inline-flex"><Plus className="size-4" /> {t("nav.listSpace")}</Link>
              )}
              <Link href="/dashboard" className="btn btn-dark hidden !py-2.5 xl:inline-flex"><LayoutDashboard className="size-4" /> {t("nav.dashboard")}</Link>

              {/* Wishlist */}
              <Link href="/dashboard?tab=saved" aria-label={`${t("nav.saved")} (${nav!.saved})`} title={t("nav.saved")}
                className="relative hidden size-10 place-items-center rounded-full hover:bg-white sm:grid">
                <Heart className={`size-5 ${nav!.saved ? "fill-coral text-coral" : ""}`} /><Count n={nav!.saved} className="bg-navy text-white" />
              </Link>

              {/* Alerts */}
              <details data-menu className="relative">
                <summary aria-label={`${t("nav.alerts")} (${nav!.alerts.length})`}
                  className="relative grid size-10 cursor-pointer list-none place-items-center rounded-full hover:bg-white [&::-webkit-details-marker]:hidden">
                  <Bell className="size-5" /><Count n={nav!.alerts.length} className="bg-coral text-white" />
                </summary>
                <div className="card absolute -right-14 mt-3 w-[min(22rem,calc(100vw-2rem))] p-2 sm:right-0">
                  <p className="px-3 pb-1 pt-2 text-sm font-extrabold">{t("nav.attention")}</p>
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
                  ) : <p className="px-3 py-4 text-sm text-muted">{t("nav.caughtUp")}</p>}
                  <Link href="/dashboard" className="mt-1 block rounded-xl px-3 py-2 text-center text-sm font-bold text-brand hover:bg-surface">{t("nav.openDashboard")}</Link>
                </div>
              </details>


              {/* Account */}
              <details data-menu className="relative">
                <summary aria-label={t("nav.account")}
                  className="grid size-10 cursor-pointer list-none place-items-center rounded-full bg-gradient-to-br from-sky to-royal text-sm font-bold text-white [&::-webkit-details-marker]:hidden">
                  {initial}
                </summary>
                <div className="card absolute right-0 mt-3 w-64 p-2 text-sm">
                  <div className="px-3 py-2">
                    <p className="truncate font-bold">{profile?.full_name || t("nav.yourAccount")}</p>
                    <p className="truncate text-xs text-muted">{profile?.company_name || user.email}</p>
                    <p className="mt-1.5 inline-block rounded-full bg-ice px-2 py-0.5 text-xs font-bold capitalize text-royal">{t(role === "tenant" ? "role.tenant" : role === "owner" ? "role.owner" : "role.admin")}</p>
                  </div>
                  <hr className="my-1 border-line" />
                  {role === "admin" && (
                    <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2 font-semibold hover:bg-surface">
                      <ClipboardCheck className="size-4 text-mint" /> {t("nav.approve")}
                      {nav!.pendingApprovals > 0 && <span className="ml-auto rounded-full bg-lime px-2 text-xs font-bold">{nav!.pendingApprovals}</span>}
                    </Link>
                  )}
                  {menu.map(([label, href, Icon]) => (
                    <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2 font-semibold hover:bg-surface">
                      <Icon className="size-4 text-muted" /> {label}
                      {href === "/dashboard?tab=saved" && nav!.saved > 0 && <span className="ml-auto text-xs font-bold text-muted">{nav!.saved}</span>}
                    </Link>
                  ))}
                  <hr className="my-1 border-line" />
                  <form action={signOut}>
                    <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left font-semibold text-danger hover:bg-surface"><LogOut className="size-4" /> {t("nav.signOut")}</button>
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
