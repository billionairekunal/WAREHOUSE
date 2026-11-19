import Link from "next/link";
import { Logo } from "./Logo";
import { getT } from "@/lib/i18n/server";

export async function Footer() {
  const { t } = await getT();
  return (
    <footer className="navy-glow mt-24 px-4 pb-28 pt-16 text-white sm:px-6 lg:pb-12">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm text-ice/75">
            {t("footer.about")}
          </p>
        </div>
        {[
          [t("footer.tenants"), [[t("nav.findSpace"), "/search"], [t("nav.flex"), "/search?flex=1"], [t("nav.dashboard"), "/dashboard"]]],
          [t("footer.owners"), [[t("nav.listYourSpace"), "/list-space"], [t("footer.howVerify"), "/#trust"], [t("footer.ownerDashboard"), "/dashboard"]]],
          [t("footer.markets"), [["Chakan MIDC", "/search?market=Chakan"], ["Talegaon MIDC", "/search?market=Talegaon"], ["Bhosari MIDC", "/search?market=Bhosari"]]],
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
        © {new Date().getFullYear()} Chakan MIDC Force. {t("footer.rights")}
      </p>
    </footer>
  );
}
