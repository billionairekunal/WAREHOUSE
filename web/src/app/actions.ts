"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { LANG_COOKIE, isLang } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/push";

/** Fire-and-forget push after the response is sent. */
const push = (userId: string | null | undefined, title: string, body: string, link = "/dashboard") =>
  after(() => notify(userId, { title, body, link }));

// ---------- language ----------
export async function setLang(lang: string) {
  if (!isLang(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}

// ---------- push tokens ----------
export async function savePushToken(token: string, userAgent: string) {
  const { supabase, user } = await requireUser();
  if (!user || !token || token.length > 4096) return;
  await supabase.from("push_tokens").upsert({ token, user_id: user.id, user_agent: userAgent.slice(0, 300) });
}

type Result = { ok: true; message?: string } | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

const num = (v: FormDataEntryValue | null) => {
  const n = Number(v);
  return v === null || v === "" || Number.isNaN(n) ? null : n;
};
const str = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() ? v.trim() : null);

// ---------- auth ----------
export async function signIn(_: unknown, fd: FormData): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(fd.get("email")), password: String(fd.get("password")),
  });
  if (error) return { ok: false, error: error.message };
  const next = str(fd.get("next"));
  redirect(next && /^\/(?![/\\])/.test(next) ? next : "/dashboard"); // same-site paths only
}

export async function signUp(_: unknown, fd: FormData): Promise<Result> {
  const password = String(fd.get("password"));
  if (password.length < 8) return { ok: false, error: (await getT()).t("msg.pwShort") };
  const supabase = await createClient();
  const origin = (await headers()).get("origin"); // confirmation email returns to whichever site they signed up on
  const { data, error } = await supabase.auth.signUp({
    email: String(fd.get("email")),
    password,
    options: {
      emailRedirectTo: origin ? `${origin}/auth/callback?next=${fd.get("role") === "owner" ? "/list-space" : "/dashboard"}` : undefined,
      data: {
        full_name: str(fd.get("full_name")),
        company_name: str(fd.get("company_name")),
        phone: str(fd.get("phone")),
        role: fd.get("role") === "owner" ? "owner" : "tenant",
      },
    },
  });
  if (error) return { ok: false, error: error.message };
  if (!data.session) return { ok: true, message: (await getT()).t("msg.checkInbox") };
  redirect(fd.get("role") === "owner" ? "/list-space" : "/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ---------- favorites ----------
export async function toggleFavorite(listingId: string, saved: boolean): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "login" };
  const q = saved
    ? supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", listingId)
    : supabase.from("favorites").insert({ user_id: user.id, listing_id: listingId });
  const { error } = await q;
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/saved");
  return { ok: true };
}

// ---------- tenant: quote + visit ----------
export async function requestQuote(_: unknown, fd: FormData): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "login" };
  const area = num(fd.get("area_sqft"));
  const { t } = await getT();
  if (!area || area <= 0) return { ok: false, error: t("msg.enterArea") };
  const { data, error } = await supabase.from("quotes").insert({
    listing_id: String(fd.get("listing_id")),
    tenant_id: user.id,
    area_sqft: area,
    move_in: str(fd.get("move_in")),
    tenure_months: num(fd.get("tenure_months")),
    tenant_note: str(fd.get("tenant_note")),
  }).select("owner_id, tenant_company, listing:listings(name)").single();
  if (error) return { ok: false, error: error.message };
  push(data.owner_id, "New quote request",
    `${data.tenant_company ?? "A company"} needs ${area.toLocaleString("en-IN")} sq ft at ${(data.listing as unknown as { name: string })?.name}`,
    "/dashboard?tab=requests");
  revalidatePath("/dashboard");
  return { ok: true, message: t("msg.quoteOk") };
}

export async function requestVisit(_: unknown, fd: FormData): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "login" };
  const when = str(fd.get("scheduled_at"));
  const { t } = await getT();
  if (!when || new Date(when) < new Date()) return { ok: false, error: t("msg.futureDate") };
  const { data, error } = await supabase.from("visits").insert({
    listing_id: String(fd.get("listing_id")), tenant_id: user.id,
    scheduled_at: new Date(when).toISOString(), note: str(fd.get("note")),
  }).select("owner_id, tenant_company, listing:listings(name)").single();
  if (error) return { ok: false, error: error.message };
  push(data.owner_id, "Site visit requested",
    `${data.tenant_company ?? "A company"} wants to visit ${(data.listing as unknown as { name: string })?.name}`, "/dashboard?tab=visits");
  revalidatePath("/dashboard");
  return { ok: true, message: t("msg.visitOk") };
}

export async function tenantQuoteAction(id: string, status: "accepted" | "rejected" | "withdrawn" | "negotiating", counter?: number) {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("quotes").update({ status, ...(counter ? { counter_rent_psf: counter } : {}) })
    .eq("id", id).select("owner_id, tenant_company, status, listing:listings(name)").single();
  const what = { accepted: "accepted your quote", rejected: "declined your quote", withdrawn: "withdrew their request", negotiating: `sent a counter-offer of ₹${counter}/sq ft` }[status];
  if (data?.status === status) push(data.owner_id, "Quote update", `${data.tenant_company ?? "The company"} ${what} for ${(data.listing as unknown as { name: string })?.name}`, "/dashboard?tab=requests");
  revalidatePath("/dashboard");
}

// ---------- owner: respond ----------
export async function ownerQuote(_: unknown, fd: FormData): Promise<Result> {
  const { supabase } = await requireUser();
  const rent = num(fd.get("rent_psf"));
  if (!rent) return { ok: false, error: "Enter rent per sq ft." };
  const { data, error } = await supabase.from("quotes").update({
    status: "quoted",
    rent_psf: rent,
    cam_psf: num(fd.get("cam_psf")),
    deposit_months: num(fd.get("deposit_months")),
    lock_in_months: num(fd.get("lock_in_months")),
    escalation_pct: num(fd.get("escalation_pct")),
    rent_free_days: num(fd.get("rent_free_days")),
    valid_until: str(fd.get("valid_until")),
    owner_note: str(fd.get("owner_note")),
  }).eq("id", String(fd.get("id"))).select("tenant_id, listing:listings(name)").single();
  if (error) return { ok: false, error: error.message };
  push(data.tenant_id, "You have a new quote", `₹${rent}/sq ft for ${(data.listing as unknown as { name: string })?.name}. Compare it now.`, "/dashboard?tab=quotes");
  revalidatePath("/dashboard");
  return { ok: true, message: "Quote sent." };
}

export async function ownerDecline(id: string) {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("quotes").update({ status: "rejected" }).eq("id", id).select("tenant_id, status, listing:listings(name)").single();
  if (data?.status === "rejected") push(data.tenant_id, "Quote request declined", `The owner of ${(data.listing as unknown as { name: string })?.name} can't take this one. Similar spaces are waiting.`, "/search");
  revalidatePath("/dashboard");
}

export async function visitStatus(id: string, status: "confirmed" | "cancelled" | "done") {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("visits").update({ status }).eq("id", id).select("tenant_id, owner_id, status, scheduled_at, listing:listings(name)").single();
  if (data?.status === status) {
    const other = user?.id === data.owner_id ? data.tenant_id : data.owner_id;
    const when = new Date(data.scheduled_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
    const name = (data.listing as unknown as { name: string })?.name;
    if (status !== "done") push(other, status === "confirmed" ? "Site visit confirmed" : "Site visit cancelled", `${name} · ${when}`, "/dashboard?tab=visits");
  }
  revalidatePath("/dashboard");
}

// ---------- listings ----------
export type ListingInput = Record<string, unknown> & { id?: string; name: string };

const LISTING_COLUMNS = new Set([
  "name", "city", "micro_market", "address", "pincode", "lat", "lng", "primary_type", "storage_types", "building_type",
  "area_total", "area_available", "area_min", "description", "dist_highway_km", "dist_airport_km", "dist_railway_km",
  "road_width_ft", "inside_midc", "container_40ft", "landmarks", "grade", "flooring", "clear_height_m", "eave_height_m",
  "floor_load_mt", "docks", "dock_levelers", "truck_parking", "office_sqft", "amenities", "power_kva", "power_backup",
  "fire_safety", "fire_noc", "fire_noc_expiry", "documents", "rent_psf", "cam_psf", "deposit_months", "escalation_pct",
  "lock_in_months", "available_from", "flex_enabled", "flex_rate_pallet", "photos",
]);

export async function saveListing(input: ListingInput, submit: boolean): Promise<Result & { id?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "login" };
  if (!input.name?.trim()) return { ok: false, error: "Warehouse name is required." };

  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) if (LISTING_COLUMNS.has(k)) row[k] = v === "" ? null : v;
  row.status = submit ? "submitted" : "draft";

  const res = input.id
    ? await supabase.from("listings").update(row).eq("id", input.id).select("id").single()
    : await supabase.from("listings").insert({ ...row, owner_id: user.id }).select("id").single();
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath("/dashboard");
  return { ok: true, id: res.data.id };
}

export async function setListingStatus(id: string, status: "paused" | "live" | "leased") {
  const { supabase } = await requireUser();
  await supabase.from("listings").update({ status }).eq("id", id);
  revalidatePath("/dashboard");
}

