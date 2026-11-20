import { createClient } from "@supabase/supabase-js";
import type { Messaging } from "firebase-admin/messaging";

type Msg = { title: string; body: string; link: string };

let messaging: Messaging | null | undefined;
async function getMessaging() {
  if (messaging !== undefined) return messaging;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return (messaging = null); // sending is off until the service account is configured
  const { cert, getApps, initializeApp } = await import("firebase-admin/app");
  const app = getApps()[0] ?? initializeApp({ credential: cert(JSON.parse(raw)) });
  return (messaging = (await import("firebase-admin/messaging")).getMessaging(app));
}

/** Pushes to every device of a user and prunes dead tokens. Server-only; never throws. */
export async function notify(userId: string | null | undefined, msg: Msg) {
  try {
    if (!userId) return;
    const fcm = await getMessaging();
    if (!fcm) return;
    // service-role client: reading another user's tokens must stay on the server
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
    const { data } = await db.from("push_tokens").select("token").eq("user_id", userId);
    const tokens = (data ?? []).map((r) => r.token as string);
    if (!tokens.length) return;
    const res = await fcm.sendEachForMulticast({ tokens, data: msg, webpush: { fcmOptions: { link: msg.link } } });
    const dead = res.responses.flatMap((r, i) =>
      r.error && ["messaging/registration-token-not-registered", "messaging/invalid-registration-token"].includes(r.error.code) ? [tokens[i]] : []);
    if (dead.length) await db.from("push_tokens").delete().in("token", dead);
  } catch (e) {
    console.error("push failed", e);
  }
}

/** Pushes to every admin (new requests, owner replies, counters). Server-only; never throws. */
export async function notifyAdmins(msg: Msg) {
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
    const { data } = await db.from("profiles").select("id").eq("role", "admin");
    await Promise.all((data ?? []).map((a) => notify(a.id as string, msg)));
  } catch { /* push is best-effort */ }
}
