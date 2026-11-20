import type { SupabaseClient } from "@supabase/supabase-js";
import type { T } from "@/lib/i18n";

export type Alert = { id: string; text: string; sub: string; href: string; kind: "quote" | "visit" };
export type NavData = { saved: number; alerts: Alert[]; pendingApprovals: number };

type Row = { id: string; status: string; tenant_company?: string | null; area_sqft?: number; rent_psf?: number | null; scheduled_at?: string; listing: { name: string } | null };
const nameOf = (r: Row) => r.listing?.name ?? "a listing";
const when = (iso: string, locale: string) => new Date(iso).toLocaleString(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
const L = "listing:listings(name)";

/** Counts and actionable items for the header. Only items that need the user's attention count as alerts. */
export async function loadNav(supabase: SupabaseClient, userId: string, role: string, t: T, locale: string): Promise<NavData> {
  const owner = role === "owner" || role === "admin";
  const admin = role === "admin";
  const none = Promise.resolve({ data: [] as Row[] });
  const [saved, myQuotes, myVisits, offers, visitOffers, deals, visits, approvals] = await Promise.all([
    supabase.from("favorites").select("listing_id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("quotes").select(`id,status,rent_psf,${L}`).eq("tenant_id", userId).eq("status", "quoted").limit(5),
    supabase.from("visits").select(`id,status,scheduled_at,${L}`).eq("tenant_id", userId).eq("status", "confirmed")
      .gte("scheduled_at", new Date().toISOString()).limit(5),
    // owners only ever see the anonymised offer rows
    owner ? supabase.from("quote_offers").select(`id,status,area_sqft,${L}`).eq("owner_id", userId).in("status", ["requested", "negotiating"]).limit(5) : none,
    owner ? supabase.from("visit_offers").select(`id,status,scheduled_at,${L}`).eq("owner_id", userId).eq("status", "requested").limit(5) : none,
    admin ? supabase.from("quotes").select(`id,status,tenant_company,area_sqft,${L}`).in("status", ["pending_review", "owner_quoted", "counter_review", "accepted"]).order("updated_at", { ascending: false }).limit(8) : none,
    admin ? supabase.from("visits").select(`id,status,tenant_company,scheduled_at,${L}`).in("status", ["pending_review", "owner_responded"]).limit(5) : none,
    admin ? supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "submitted") : null,
  ]);

  const rows = (r: { data: unknown } | null) => ((r?.data ?? []) as Row[]);
  const verified = t("alert.aCompany");
  const alerts: Alert[] = [
    ...rows(deals).map((q) => ({
      id: q.id, kind: "quote" as const, href: "/admin/quotes",
      text: q.status === "owner_quoted" ? t("alert.ownerQuoted") : q.status === "accepted" ? t("alert.accepted", { c: q.tenant_company ?? verified })
        : t(q.status === "counter_review" ? "alert.counter" : "alert.quoteRequest", { c: q.tenant_company ?? verified }),
      sub: `${nameOf(q)} · ${q.area_sqft?.toLocaleString("en-IN")} sq ft`,
    })),
    ...rows(visits).map((v) => ({
      id: v.id, kind: "visit" as const, href: "/admin/visits",
      text: v.status === "owner_responded" ? t("alert.ownerVisit") : t("alert.visitRequest", { c: v.tenant_company ?? verified }),
      sub: `${nameOf(v)} · ${when(v.scheduled_at!, locale)}`,
    })),
    ...rows(offers).map((q) => ({
      id: q.id, kind: "quote" as const, href: "/dashboard?tab=requests",
      text: t(q.status === "negotiating" ? "alert.counter" : "alert.quoteRequest", { c: verified }),
      sub: `${nameOf(q)} · ${q.area_sqft?.toLocaleString("en-IN")} sq ft`,
    })),
    ...rows(visitOffers).map((v) => ({
      id: v.id, kind: "visit" as const, href: "/dashboard?tab=visits",
      text: t("alert.visitRequest", { c: verified }), sub: `${nameOf(v)} · ${when(v.scheduled_at!, locale)}`,
    })),
    ...rows(myQuotes).map((q) => ({
      id: q.id, kind: "quote" as const, href: "/dashboard?tab=quotes",
      text: t("alert.quoteReceived"), sub: `${nameOf(q)} · ₹${q.rent_psf}/sq ft`,
    })),
    ...rows(myVisits).map((v) => ({
      id: v.id, kind: "visit" as const, href: "/dashboard?tab=visits",
      text: t("alert.visitConfirmed"), sub: `${nameOf(v)} · ${when(v.scheduled_at!, locale)}`,
    })),
  ];

  return { saved: saved.count ?? 0, alerts, pendingApprovals: approvals?.count ?? 0 };
}
