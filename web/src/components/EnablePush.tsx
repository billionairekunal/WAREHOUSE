"use client";
import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, X } from "lucide-react";
import { getPushToken } from "@/lib/firebase";
import { savePushToken } from "@/app/actions";

type S = "hidden" | "ask" | "busy" | "on" | "denied";

function initial(): S {
  if (typeof window === "undefined" || typeof Notification === "undefined" || !("serviceWorker" in navigator)) return "hidden";
  if (Notification.permission === "granted") return "on";
  let dismissed = false;
  try { dismissed = localStorage.getItem("push-dismissed") === "1"; } catch {}
  return Notification.permission === "denied" || dismissed ? "hidden" : "ask";
}

/** Opt-in card. Permission is only requested on click, never on page load. */
export function EnablePush({ isOwner }: { isOwner: boolean }) {
  const [state, setState] = useState<S>("hidden");

  useEffect(() => {
    const s = initial();
    if (s === "on") {
      // refresh the stored token for users who already allowed notifications
      getPushToken().then((t) => { if (t) return savePushToken(t, navigator.userAgent); }).catch(() => {});
    } else if (s === "ask") {
      queueMicrotask(() => setState("ask"));
    }
  }, []);

  if (state === "hidden" || state === "on") return null;

  const turnOn = async () => {
    setState("busy");
    try {
      const t = await getPushToken();
      if (!t) return setState(Notification.permission === "denied" ? "denied" : "ask");
      await savePushToken(t, navigator.userAgent);
      setState("on");
    } catch {
      setState("ask");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-[1.75rem] border border-ice bg-gradient-to-r from-ice/50 to-white p-4 sm:p-5">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky to-royal text-white shadow-[var(--shadow-glow)]"><BellRing className="size-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="font-extrabold">{state === "denied" ? "Notifications are blocked" : "Get instant alerts"}</p>
        <p className="text-sm text-muted">
          {state === "denied" ? "Allow notifications for this site in your browser settings to turn them on."
            : isOwner ? "Know the moment a company requests a quote or a site visit."
            : "Know the moment an owner sends a quote or confirms your visit."}
        </p>
      </div>
      {state !== "denied" && (
        <button disabled={state === "busy"} onClick={turnOn} className="btn btn-primary">
          {state === "busy" ? "Turning on…" : <><CheckCircle2 className="size-4" /> Turn on</>}
        </button>
      )}
      <button aria-label="Dismiss" className="text-muted hover:text-ink"
        onClick={() => { try { localStorage.setItem("push-dismissed", "1"); } catch {} setState("hidden"); }}>
        <X className="size-5" />
      </button>
    </div>
  );
}
