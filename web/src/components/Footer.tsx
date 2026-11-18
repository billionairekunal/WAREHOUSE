import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="navy-glow mt-24 px-4 pb-28 pt-16 text-white sm:px-6 lg:pb-12">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm text-ice/75">
            Pune&apos;s verified marketplace for warehouses, open yards and flexible storage, starting with Chakan MIDC.
          </p>
        </div>
        {[
          ["Tenants", [["Find space", "/search"], ["Flex storage", "/search?flex=1"], ["Dashboard", "/dashboard"]]],
          ["Owners", [["List your space", "/list-space"], ["How verification works", "/#trust"], ["Owner dashboard", "/dashboard"]]],
          ["Markets", [["Chakan MIDC", "/search?market=Chakan"], ["Talegaon MIDC", "/search?market=Talegaon"], ["Bhosari MIDC", "/search?market=Bhosari"]]],
        ].map(([title, links]) => (
          <div key={title as string}>
            <p className="text-sm font-bold">{title as string}</p>
            <ul className="mt-3 space-y-2 text-sm text-ice/75">
              {(links as string[][]).map(([l, h]) => <li key={l}><Link href={h} className="hover:text-white">{l}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-6 text-xs text-ice/60">
        © {new Date().getFullYear()} Chakan MIDC Force. All rights reserved.
      </p>
    </footer>
  );
}
