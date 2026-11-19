import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "./AuthShell";
import { AuthForm } from "./AuthForm";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const { t } = await getT();
  return (
    <AuthShell title={t("a.welcome")} accent={t("a.back")} sub={t("a.signinSub")}>
      <h2 className="mb-6 text-3xl font-black">{t("a.signin")}</h2>
      {error === "link" && <p role="alert" className="mb-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{t("a.linkErr")}</p>}
      <AuthForm mode="login" next={typeof next === "string" ? next : undefined} />
      <p className="mt-6 text-center text-sm text-muted">{t("a.new")} <Link href="/signup" className="font-bold text-brand">{t("a.create")}</Link></p>
    </AuthShell>
  );
}
