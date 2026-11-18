"use client";
import dynamic from "next/dynamic";

/** Client-only map so server pages can embed it. */
export const LazyMap = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-ice/50" />,
});
