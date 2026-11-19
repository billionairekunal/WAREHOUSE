import { redirect } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/supabase/server";

/** For admin pages: signed-in admins only; everyone else is sent away. */
export async function requireAdminPage() {
  const s = await getSession();
  if (!s.user) redirect("/login?next=/admin");
  if (s.profile?.role !== "admin") redirect("/");
  return s;
}

/** For admin server actions: throws instead of redirecting. Verifies the JWT with Supabase (getUser), not just locally. */
export async function requireAdminAction() {
  const s = await getSession();
  const { data: { user } } = await s.supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: p } = await s.supabase.from("profiles").select("role").eq("id", user.id).single();
  if (p?.role !== "admin") throw new Error("Admins only");
  return { supabase: s.supabase, adminId: user.id };
}

/** Service-role client for things RLS cannot do (auth emails, blocking). Use only after an admin check. */
export function serviceClient() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
}
