"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { List, Map as MapIcon } from "lucide-react";
import type { Pin } from "@/components/MapView";
import { useT } from "@/lib/i18n/client";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-ice/40" />,
});

/** Desktop: list + sticky map. Mobile: list, with a floating toggle to a full map. */
export function ResultsLayout({ pins, children }: { pins: Pin[]; children: React.ReactNode }) {
  const [showMap, setShowMap] = useState(false);
  const { t } = useT();
  return (
    <div className="mt-5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(380px,42%)] lg:gap-6">
      <div className={showMap ? "hidden lg:block" : ""}>{children}</div>
      <div className={`${showMap ? "block" : "hidden"} h-[calc(100dvh-210px)] overflow-hidden rounded-[1.75rem] border border-line shadow-[var(--shadow-soft)] lg:sticky lg:top-24 lg:block lg:h-[calc(100dvh-120px)]`}>
        {/* remount on toggle so Leaflet measures a visible container */}
        <MapView key={String(showMap)} pins={pins} />
      </div>
      <button
        onClick={() => setShowMap(!showMap)}
        className="btn btn-dark fixed bottom-24 left-1/2 z-40 -translate-x-1/2 shadow-[var(--shadow-lift)] lg:hidden"
      >
        {showMap ? <><List className="size-4" /> {t("map.list")}</> : <><MapIcon className="size-4" /> {t("map.show")}</>}
      </button>
    </div>
  );
}
