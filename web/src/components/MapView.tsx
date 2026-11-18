"use client";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

export type Pin = { id: string; lat: number; lng: number; label: string; href?: string; title?: string };

/** OpenStreetMap + price-pill markers. No API key needed. */
export default function MapView({ pins, zoom = 11, className = "", controls = true, padBottom = 50 }: { pins: Pin[]; zoom?: number; className?: string; controls?: boolean; padBottom?: number }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      map.current?.remove();
      const m = L.map(el.current, { scrollWheelZoom: false, zoomControl: controls }).setView([18.73, 73.86], zoom);
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
  }, [pins, zoom, controls, padBottom]);

  return <div ref={el} className={`relative isolate z-0 h-full w-full ${className}`} role="region" aria-label="Map of spaces" />;
}
