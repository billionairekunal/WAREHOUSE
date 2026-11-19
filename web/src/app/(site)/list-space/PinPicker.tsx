"use client";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";

/** Click the map to drop the warehouse pin. */
export default function PinPicker({ lat, lng, onPick }: { lat: number | null; lng: number | null; onPick: (lat: number, lng: number) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const pick = useRef(onPick);
  useEffect(() => { pick.current = onPick; }, [onPick]);

  useEffect(() => {
    let off = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (off || !el.current) return;
      const m = L.map(el.current).setView([lat ?? 18.74, lng ?? 73.84], lat ? 14 : 11);
      map.current = m;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors", maxZoom: 19 }).addTo(m);
      const icon = L.divIcon({ className: "", html: '<span class="price-pin active">📍 Your warehouse</span>', iconSize: [0, 0] });
      if (lat && lng) marker.current = L.marker([lat, lng], { icon }).addTo(m);
      m.on("click", (e) => {
        const { lat: a, lng: b } = e.latlng;
        if (marker.current) marker.current.setLatLng(e.latlng);
        else marker.current = L.marker(e.latlng, { icon }).addTo(m);
        pick.current(Number(a.toFixed(6)), Number(b.toFixed(6)));
      });
    })();
    return () => { off = true; map.current?.remove(); map.current = null; marker.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={el} className="relative isolate z-0 h-full w-full cursor-crosshair" />;
}
