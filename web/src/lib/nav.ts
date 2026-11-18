import type { SupabaseClient } from "@supabase/supabase-js";

export type Alert = { id: string; text: string; sub: string; href: string; kind: "quote" | "visit" };
export type NavData = { saved: number; alerts: Alert[]; pendingApprovals: number };

type Row = { id: string; status: string; tenant_company?: string | null; area_sqft?: number; rent_psf?: number | null; scheduled_at?: string; listing: { name: string } | null };
const nameOf = (r: Row) => r.listing?.name ?? "a listing";
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/** Counts and actionable items for the header. Only items that need the user's attention count as alerts. */
export async function loadNav(supabase: SupabaseClient, userId: string, role: string): Promise<NavData> {
  const owner = role === "owner" || role === "admin";
  const [saved, myQuotes, myVisits, inQuotes, inVisits, approvals] = await Promise.all([
    supabase.from("favorites").select("listing_id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("quotes").select("id,status,rent_psf,listing:listings(name)").eq("tenant_id", userId).eq("status", "quoted").limit(5),
    supabase.from("visits").select("id,status,scheduled_at,listing:listings(name)").eq("tenant_id", userId).eq("status", "confirmed")
      .gte("scheduled_at", new Date().toISOString()).limit(5),
    owner ? supabase.from("quotes").select("id,status,tenant_company,area_sqft,listing:listings(name)").eq("owner_id", userId).in("status", ["requested", "negotiating"]).limit(5) : null,
    owner ? supabase.from("visits").select("id,status,tenant_company,scheduled_at,listing:listings(name)").eq("owner_id", userId).eq("status", "requested").limit(5) : null,
    role === "admin" ? supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "submitted") : null,
  ]);

  const rows = (r: { data: unknown } | null) => ((r?.data ?? []) as Row[]);
  const alerts: Alert[] = [
    ...rows(inQuotes).map((q) => ({
      id: q.id, kind: "quote" as const, href: "/dashboard?tab=requests",
      text: q.status === "negotiating" ? `Counter-offer from ${q.tenant_company ?? "a company"}` : `Quote request from ${q.tenant_company ?? "a company"}`,
      sub: `${nameOf(q)} · ${q.area_sqft?.toLocaleString("en-IN")} sq ft`,
    })),
    ...rows(inVisits).map((v) => ({
      id: v.id, kind: "visit" as const, href: "/dashboard?tab=visits",
      text: `Visit request from ${v.tenant_company ?? "a company"}`, sub: `${nameOf(v)} · ${when(v.scheduled_at!)}`,
    })),
    ...rows(myQuotes).map((q) => ({
      id: q.id, kind: "quote" as const, href: "/dashboard?tab=quotes",
      text: "New quote received", sub: `${nameOf(q)} · ₹${q.rent_psf}/sq ft`,
    })),
    ...rows(myVisits).map((v) => ({
      id: v.id, kind: "visit" as const, href: "/dashboard?tab=visits",
      text: "Site visit confirmed", sub: `${nameOf(v)} · ${when(v.scheduled_at!)}`,
    })),
  ];

  return { saved: saved.count ?? 0, alerts, pendingApprovals: approvals?.count ?? 0 };
}
