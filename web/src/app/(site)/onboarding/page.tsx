import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession, profileDone } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { AuthShell } from "../login/AuthShell";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Complete your profile" };
const safe = (n: unknown) => (typeof n === "string" && /^\/(?![/\\])/.test(n) ? n : "");

export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  const next = safe((await searchParams).next);
  const { user, profile } = await getSession();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/onboarding${next ? `?next=${next}` : ""}`)}`);
  if (profileDone(profile)) redirect(next || "/dashboard");
  const { t } = await getT();
  return (
    <AuthShell title={t("o.title")} accent={t("o.accent")} sub={t("o.sub")}>
      <h2 className="mb-6 text-3xl font-black">{t("o.head")}</h2>
      <ProfileForm next={next} email={user.email ?? ""} name={profile?.full_name ?? ""} phone={profile?.phone ?? ""} company={profile?.company_name ?? ""}
        role={profile?.role === "owner" || next.startsWith("/list-space") ? "owner" : "tenant"} />
    </AuthShell>
  );
}
