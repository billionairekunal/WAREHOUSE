import Link from "next/link";
import { Warehouse } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export async function Logo({ light = false }: { light?: boolean }) {
  const { t } = await getT();
  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="Chakan MIDC Force home">
      <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-sky via-brand to-royal text-white shadow-[var(--shadow-glow)]">
        <Warehouse className="size-5" strokeWidth={2.2} />
      </span>
      <span className={`leading-tight ${light ? "text-white" : "text-ink"}`}>
        <span className="display block text-base font-extrabold">Chakan MIDC Force</span>
        <span className={`hidden text-[11px] font-medium sm:block ${light ? "text-ice/80" : "text-muted"}`}>{t("brand.tagline")}</span>
      </span>
    </Link>
  );
}
