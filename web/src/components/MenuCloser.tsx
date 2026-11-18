"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Closes header dropdowns (<details data-menu>) on outside click, Escape, or page change. */
export function MenuCloser() {
  const path = usePathname();
  useEffect(() => {
    const closeAll = (except?: Node | null) =>
      document.querySelectorAll<HTMLDetailsElement>("details[data-menu][open]").forEach((d) => {
        if (!except || !d.contains(except)) d.open = false;
      });
    closeAll();
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element;
      // a link inside a menu: close after navigating; outside click: close everything else
      closeAll(t.closest("a") ? null : t);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAll();
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [path]);
  return null;
}
