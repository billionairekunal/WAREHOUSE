"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Home, Search, PlusCircle, Heart, UserRound } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Explore", icon: Search },
  { href: "/list-space", label: "List", icon: PlusCircle },
  { href: "/dashboard?tab=saved", label: "Saved", icon: Heart },
  { href: "/dashboard", label: "Account", icon: UserRound },
];

function Bar() {
  const path = usePathname();
  const tab = useSearchParams().get("tab");
  if (path.startsWith("/warehouse/")) return null; // detail page has its own sticky CTA bar
  const isActive = (href: string, label: string) => {
    const base = href.split("?")[0];
    if (base === "/") return path === "/";
    if (label === "Saved") return path === "/dashboard" && tab === "saved";
    if (label === "Account") return path.startsWith("/dashboard") && tab !== "saved";
    return path.startsWith(base);
  };
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-3 z-50 px-4 lg:hidden">
      <ul className="glass mx-auto flex max-w-sm items-center justify-between rounded-full p-1.5 shadow-[var(--shadow-lift)]">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(href, label);
          return (
            <li key={label}>
              <Link href={href} aria-current={active ? "page" : undefined} aria-label={label}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-3 text-sm font-bold transition-all duration-300 ${
                  active ? "bg-gradient-to-br from-sky to-royal px-5 text-white shadow-[var(--shadow-glow)]" : "text-muted"}`}>
                <Icon className="size-5" />
                {active && <span>{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Floating glass tab bar with a filled active pill, phones only. */
export function MobileNav() {
  return <Suspense><Bar /></Suspense>;
}
