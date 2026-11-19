"use client";
import dynamic from "next/dynamic";
import { useMemo } from "react";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false, loading: () => <div className="h-full animate-pulse bg-ice/40" /> });

export function MiniMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const pins = useMemo(() => [{ id: "x", lat, lng, label: "📍 " + label }], [lat, lng, label]);
  return <MapView pins={pins} cooperative />;
}
