import Link from "next/link";
import { Warehouse } from "lucide-react";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="Chakan MIDC Force home">
      <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-sky via-brand to-royal text-white shadow-[var(--shadow-glow)]">
        <Warehouse className="size-5" strokeWidth={2.2} />
      </span>
      <span className={`leading-tight ${light ? "text-white" : "text-ink"}`}>
        <span className="display block text-base font-extrabold">Chakan MIDC Force</span>
        <span className={`block text-[11px] font-medium ${light ? "text-ice/80" : "text-muted"}`}>Verified industrial space</span>
      </span>
    </Link>
  );
}
