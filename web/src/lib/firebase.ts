"use client";
import { getApp, getApps, initializeApp } from "firebase/app";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const firebaseApp = () => (getApps().length ? getApp() : initializeApp(config));

/** Asks permission, registers the service worker and returns this device's FCM token. */
export async function getPushToken(): Promise<string | null> {
  const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
  if (!(await isSupported())) return null;
  if ((await Notification.requestPermission()) !== "granted") return null;
  const qs = new URLSearchParams(Object.entries(config).filter(([, v]) => v) as [string, string][]);
  const sw = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${qs}`);
  return getToken(getMessaging(firebaseApp()), {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: sw,
  });
}
