"use client";
import { useEffect } from "react";
import { firebaseApp } from "@/lib/firebase";

/** Starts Google Analytics (where supported) and shows pushes that arrive while the tab is open. */
export function FirebaseInit() {
  useEffect(() => {
    (async () => {
      const { getAnalytics, isSupported } = await import("firebase/analytics");
      if (await isSupported()) getAnalytics(firebaseApp());

      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const m = await import("firebase/messaging");
      if (!(await m.isSupported())) return;
      m.onMessage(m.getMessaging(firebaseApp()), async ({ data }) => {
        const reg = await navigator.serviceWorker.getRegistration();
        reg?.showNotification(data?.title ?? "Chakan MIDC Force", { body: data?.body, icon: "/favicon.ico", data: { link: data?.link } });
      });
    })().catch(() => {});
  }, []);
  return null;
}
