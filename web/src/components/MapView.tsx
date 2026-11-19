"use client";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import { Hand } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { useT } from "@/lib/i18n/client";

export type Pin = { id: string; lat: number; lng: number; label: string; href?: string; title?: string };

/**
 * OpenStreetMap + price-pill markers. No API key needed.
 * `cooperative`: for maps embedded in a scrolling page. On touch screens one finger scrolls the page
 * (Leaflet's one-finger panning is off, so the container gets touch-action: pan-x pan-y) and two fingers
 * pinch-zoom the map. Full-screen maps leave it off so they pan normally.
 */
export default function MapView({ pins, zoom = 11, className = "", controls = true, padBottom = 50, cooperative = false }: {
  pins: Pin[]; zoom?: number; className?: string; controls?: boolean; padBottom?: number; cooperative?: boolean;
}) {
  const { t } = useT();
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  // MapView only renders in the browser (loaded with ssr: false), so window is available here
  const touchOnly = cooperative && typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      map.current?.remove();
      const m = L.map(el.current, { scrollWheelZoom: false, zoomControl: controls, dragging: !touchOnly, touchZoom: true })
        .setView([18.73, 73.86], zoom);
      map.current = m;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(m);
      const valid = pins.filter((p) => p.lat && p.lng);
      valid.forEach((p) => {
        const safe = p.label.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`); // labels can be owner-written
        const icon = L.divIcon({ className: "", html: `<span class="price-pin">${safe}</span>`, iconSize: [0, 0] });
        const mk = L.marker([p.lat, p.lng], { icon, title: p.title }).addTo(m);
        if (p.href) mk.on("click", () => (window.location.href = p.href!));
      });
      if (valid.length > 1) m.fitBounds(L.latLngBounds(valid.map((p) => [p.lat, p.lng])), { paddingTopLeft: [50, 70], paddingBottomRight: [50, padBottom] });
      else if (valid.length === 1) m.setView([valid[0].lat, valid[0].lng], 13);
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, [pins, zoom, controls, padBottom, touchOnly]);

  return (
    <div className={`relative isolate z-0 h-full w-full ${className}`}>
      <div ref={el} className="h-full w-full" role="region" aria-label="Map of spaces" />
      {touchOnly && (
        <span className="pointer-events-none absolute bottom-3 left-1/2 z-[500] inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-navy/75 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur">
          <Hand className="size-3.5" /> {t("map.pinch")}
        </span>
      )}
    </div>
  );
}
