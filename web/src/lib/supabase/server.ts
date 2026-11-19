import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // called from a Server Component; proxy refreshes the session instead
          }
        },
      },
    },
  );
}

/**
 * Signed-in user + profile for rendering pages. Verifies the session JWT locally (getClaims) instead of
 * a network call per request, and is cached per request so the header and page share one lookup.
 * Writes still go through getUser() in server actions, and row-level security guards every query.
 */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return { supabase, user: null, profile: null };
  const user = { id: claims.sub, email: (claims.email as string | undefined) ?? null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return { supabase, user, profile: profile as Profile | null };
});

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: "tenant" | "owner" | "admin";
  company_name: string | null;
  gstin: string | null;
};
