import Link from "next/link";
import { Warehouse } from "lucide-react";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Chakan MIDC Force home">
      <span className="grid size-9 place-items-center rounded-xl bg-brand text-white">
        <Warehouse className="size-5" strokeWidth={2.2} />
      </span>
      <span className={`display text-[17px] font-extrabold ${light ? "text-white" : "text-ink"}`}>Chakan MIDC Force</span>
    </Link>
  );
}
