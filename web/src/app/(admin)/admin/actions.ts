"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireAdminAction, serviceClient } from "@/lib/admin";
import { notify } from "@/lib/push";

const LISTING_STATUSES = ["draft", "submitted", "live", "leased", "rejected", "paused"] as const;
const QUOTE_STATUSES = ["requested", "quoted", "negotiating", "accepted", "rejected", "withdrawn", "expired"] as const;
const VISIT_STATUSES = ["requested", "confirmed", "done", "cancelled"] as const;
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

// ---------- quotes & visits ----------
export async function setQuoteStatus(id: string, status: string) {
  if (!QUOTE_STATUSES.includes(status as never)) return;
  const { supabase } = await requireAdminAction();
  await supabase.from("quotes").update({ status }).eq("id", id);
  refresh();
}

export async function setVisitStatus(id: string, status: string) {
  if (!VISIT_STATUSES.includes(status as never)) return;
  const { supabase } = await requireAdminAction();
  await supabase.from("visits").update({ status }).eq("id", id);
  refresh();
}
