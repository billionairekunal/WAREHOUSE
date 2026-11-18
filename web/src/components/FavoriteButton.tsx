"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/app/actions";

export function FavoriteButton({ id, initial = false, className = "", dark = false }: { id: string; initial?: boolean; className?: string; dark?: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label={saved ? "Remove from saved" : "Save space"}
      aria-pressed={saved}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setSaved(!saved);
        start(async () => {
          const r = await toggleFavorite(id, saved);
          if (!r.ok) {
            setSaved(saved);
            if (r.error === "login") router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
          }
        });
      }}
      className={`grid size-10 place-items-center rounded-full backdrop-blur transition hover:scale-110 ${dark ? "bg-navy/85" : "bg-white/90"} ${className}`}
    >
      <Heart className={`size-[18px] ${saved ? "fill-coral text-coral" : dark ? "text-white" : "text-ink"}`} />
    </button>
  );
}
