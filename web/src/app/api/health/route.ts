import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/** Public deploy check: which Supabase project this build talks to, and whether config is present. No secrets returned. */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const out: Record<string, unknown> = {
    supabaseProject: url ? new URL(url).hostname.split(".")[0] : null,
    publishableKey: key ? `${key.slice(0, 18)}…` : null,
    secretKeySet: !!process.env.SUPABASE_SECRET_KEY,
    firebaseConfigured: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };
  if (url && key) {
    const db = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await db.rpc("platform_stats");
    out.liveListings = error ? `error: ${error.message}` : (data as { listings: number }).listings;
  }
  if (url && process.env.SUPABASE_SECRET_KEY) {
    const admin = createClient(url, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
    const { data, error } = await admin.storage.getBucket("listing-photos");
    out.photoBucket = error ? `missing: ${error.message}` : data?.id;
  }
  return Response.json(out);
}
