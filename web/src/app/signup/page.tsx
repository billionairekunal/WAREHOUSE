import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "../login/AuthShell";
import { AuthForm } from "../login/AuthForm";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const role = (await searchParams).role;
  const { t } = await getT();
  return (
    <AuthShell title={t("a.letsCreate")} accent={t("a.account")} sub={t("a.signupSub")}>
      <h2 className="mb-6 text-3xl font-black">{t("a.getStarted")}</h2>
      <AuthForm mode="signup" role={typeof role === "string" ? role : undefined} />
      <p className="mt-6 text-center text-sm text-muted">{t("a.have")} <Link href="/login" className="font-bold text-brand">{t("a.signin")}</Link></p>
    </AuthShell>
  );
}
