"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireAdminAction, serviceClient } from "@/lib/admin";
import { notify } from "@/lib/push";

const LISTING_STATUSES = ["draft", "submitted", "live", "leased", "rejected", "paused"] as const;
const ROLES = ["tenant", "owner", "admin"] as const;

const refresh = () => { revalidatePath("/admin", "layout"); revalidatePath("/search"); revalidatePath("/"); };
const push = (userId: string | null | undefined, title: string, body: string, link: string) =>
  after(() => notify(userId, { title, body, link }));

// ---------- listings ----------
export async function approveListing(id: string) {
  const { supabase } = await requireAdminAction();
  const { data } = await supabase.from("listings").update({ status: "live", verified: true, rejection_reason: null })
    .eq("id", id).select("owner_id, name").single();
  if (data) push(data.owner_id, "Your listing is live 🎉", `${data.name} is verified and visible to companies.`, `/warehouse/${id}`);
  refresh();
}

export async function requestChanges(id: string, reason: string) {
  const { supabase } = await requireAdminAction();
  const why = reason.trim().slice(0, 500) || "Please update the listing details.";
  const { data } = await supabase.from("listings").update({ status: "rejected", rejection_reason: why })
    .eq("id", id).select("owner_id, name").single();
  if (data) push(data.owner_id, "Changes requested on your listing", `${data.name}: ${why}`, "/dashboard?tab=listings");
  refresh();
}

export async function setListingStatus(id: string, status: string) {
  if (!LISTING_STATUSES.includes(status as never)) return;
  const { supabase } = await requireAdminAction();
  await supabase.from("listings").update({ status }).eq("id", id);
  refresh();
}

export async function setVerified(id: string, verified: boolean) {
  const { supabase } = await requireAdminAction();
  await supabase.from("listings").update({ verified }).eq("id", id);
  refresh();
}

export async function deleteListing(id: string) {
  const { supabase } = await requireAdminAction();
  await supabase.from("listings").delete().eq("id", id);
  refresh();
}

// ---------- users ----------
export async function setUserRole(id: string, role: string) {
  if (!ROLES.includes(role as never)) return;
  const { supabase, adminId } = await requireAdminAction();
  if (id === adminId && role !== "admin") throw new Error("You cannot remove your own admin access.");
  await supabase.from("profiles").update({ role }).eq("id", id);
  refresh();
}

export async function setUserBlocked(id: string, blocked: boolean) {
  const { adminId } = await requireAdminAction();
  if (id === adminId) throw new Error("You cannot block yourself.");
  // ban_duration "none" lifts a ban; a long duration blocks sign-in until lifted
  await serviceClient().auth.admin.updateUserById(id, { ban_duration: blocked ? "876000h" : "none" });
  refresh();
}

// ---------- deals (quotes): the platform sits between company and owner ----------
const n = (v: FormDataEntryValue | null) => { const x = Number(v); return v === null || v === "" || Number.isNaN(x) ? null : x; };
const s = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 1000) : null);
const nameOf = (l: unknown) => (l as { name?: string } | null)?.name ?? "the listing";
const ist = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/** Send the request to the listing's owner, with no company identity attached. */
export async function forwardQuote(id: string, fd: FormData) {
  const { supabase } = await requireAdminAction();
  const { data: q } = await supabase.from("quotes").select("listing_id, owner_id, area_sqft, move_in, tenure_months, listing:listings(name)").eq("id", id).single();
  if (!q?.owner_id) throw new Error("This listing has no owner account. Send the quote to the company directly.");
  const { error } = await supabase.from("quote_offers").upsert({
    quote_id: id, listing_id: q.listing_id, owner_id: q.owner_id, area_sqft: q.area_sqft, move_in: q.move_in, tenure_months: q.tenure_months,
    requirements: s(fd.get("requirements")), status: "requested", counter_rent_psf: null,
  }, { onConflict: "quote_id" });
  if (error) throw new Error(error.message);
  await supabase.from("quotes").update({ status: "requested" }).eq("id", id);
  push(q.owner_id, "New enquiry from the platform", `A verified company needs ${q.area_sqft.toLocaleString("en-IN")} sq ft at ${nameOf(q.listing)}. Send your best quote.`, "/dashboard?tab=requests");
  refresh();
}

/** Approve (and optionally adjust) the owner's terms, or quote directly, and show it to the company. */
export async function sendQuote(id: string, fd: FormData) {
  const rent = n(fd.get("rent_psf"));
  if (!rent || rent <= 0) throw new Error("Enter rent per sq ft.");
  const { supabase } = await requireAdminAction();
  const { data, error } = await supabase.from("quotes").update({
    status: "quoted", rent_psf: rent, cam_psf: n(fd.get("cam_psf")), deposit_months: n(fd.get("deposit_months")),
    lock_in_months: n(fd.get("lock_in_months")), escalation_pct: n(fd.get("escalation_pct")), rent_free_days: n(fd.get("rent_free_days")),
    valid_until: s(fd.get("valid_until")), owner_note: s(fd.get("note")), counter_rent_psf: null,
  }).eq("id", id).select("tenant_id, listing:listings(name)").single();
  if (error) throw new Error(error.message);
  const { data: approved } = await supabase.from("quote_offers").update({ status: "approved" }).eq("quote_id", id).eq("status", "owner_quoted").select("owner_id").maybeSingle();
  if (approved) push(approved.owner_id, "Your quote was sent", `The platform approved your quote for ${nameOf(data.listing)} and shared it with the company.`, "/dashboard?tab=requests");
  else await supabase.from("quote_offers").update({ status: "closed" }).eq("quote_id", id).in("status", ["requested", "negotiating"]);
  push(data.tenant_id, "Your quote is ready", `₹${rent}/sq ft for ${nameOf(data.listing)}. Compare it now.`, "/dashboard?tab=quotes");
  refresh();
}

/** Pass the company's counter-offer (as is or adjusted) to the owner. */
export async function forwardCounter(id: string, fd: FormData) {
  const counter = n(fd.get("counter_rent_psf"));
  if (!counter || counter <= 0) throw new Error("Enter the counter rent.");
  const { supabase } = await requireAdminAction();
  const { data: offer } = await supabase.from("quote_offers").update({ status: "negotiating", counter_rent_psf: counter })
    .eq("quote_id", id).select("owner_id, listing:listings(name)").maybeSingle();
  if (!offer) throw new Error("No owner on this deal yet. Send a revised quote to the company instead.");
  await supabase.from("quotes").update({ status: "negotiating" }).eq("id", id);
  push(offer.owner_id, "Counter-offer from the platform", `The company asks for ₹${counter}/sq ft at ${nameOf(offer.listing)}. Send a revised quote.`, "/dashboard?tab=requests");
  refresh();
}

const OUTCOMES = { won: "Deal closed 🎉", rejected: "Request closed", expired: "Quote expired" } as const;
export async function closeDeal(id: string, outcome: string) {
  if (!(outcome in OUTCOMES)) return;
  const { supabase } = await requireAdminAction();
  const { data } = await supabase.from("quotes").update({ status: outcome }).eq("id", id).select("tenant_id, listing:listings(name)").single();
  const { data: offer } = await supabase.from("quote_offers").update({ status: "closed" }).eq("quote_id", id).select("owner_id").maybeSingle();
  if (data) {
    const title = OUTCOMES[outcome as keyof typeof OUTCOMES];
    push(data.tenant_id, title, `${nameOf(data.listing)}: our team will be in touch.`, "/dashboard?tab=quotes");
    if (offer) push(offer.owner_id, title, `The enquiry for ${nameOf(data.listing)} was closed by the platform.`, "/dashboard?tab=requests");
  }
  refresh();
}

// ---------- site visits ----------
/** Ask the owner whether they can host at the requested time (no company identity). */
export async function forwardVisit(id: string) {
  const { supabase } = await requireAdminAction();
  const { data: v } = await supabase.from("visits").select("listing_id, owner_id, scheduled_at, listing:listings(name)").eq("id", id).single();
  if (!v?.owner_id) throw new Error("This listing has no owner account. Confirm the visit directly.");
  const { error } = await supabase.from("visit_offers").upsert(
    { visit_id: id, listing_id: v.listing_id, owner_id: v.owner_id, scheduled_at: v.scheduled_at, status: "requested", owner_note: null }, { onConflict: "visit_id" });
  if (error) throw new Error(error.message);
  await supabase.from("visits").update({ status: "requested" }).eq("id", id);
  push(v.owner_id, "Site visit request", `A verified company wants to visit ${nameOf(v.listing)} on ${ist(v.scheduled_at)}. Can you host?`, "/dashboard?tab=visits");
  refresh();
}

const VISIT_MOVES = ["confirmed", "done", "cancelled"] as const;
export async function setVisitStatus(id: string, status: string) {
  if (!VISIT_MOVES.includes(status as never)) return;
  const { supabase } = await requireAdminAction();
  const { data } = await supabase.from("visits").update({ status }).eq("id", id).select("tenant_id, owner_id, listing_id, scheduled_at, listing:listings(name)").single();
  const outcome = status === "done" ? "closed" : status;
  // the owner always learns the final call, even when the admin confirmed without asking them first
  const { data: offer } = data?.owner_id && status === "confirmed"
    ? await supabase.from("visit_offers").upsert({ visit_id: id, listing_id: data.listing_id, owner_id: data.owner_id, scheduled_at: data.scheduled_at, status: outcome }, { onConflict: "visit_id" }).select("owner_id").maybeSingle()
    : await supabase.from("visit_offers").update({ status: outcome }).eq("visit_id", id).select("owner_id").maybeSingle();
  if (data && status !== "done") {
    const title = status === "confirmed" ? "Site visit confirmed" : "Site visit cancelled";
    const body = `${nameOf(data.listing)} · ${ist(data.scheduled_at)}`;
    push(data.tenant_id, title, body, "/dashboard?tab=visits");
    if (offer) push(offer.owner_id, title, body, "/dashboard?tab=visits");
  }
  refresh();
}
