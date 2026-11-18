import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "../login/AuthShell";
import { AuthForm } from "../login/AuthForm";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const role = (await searchParams).role;
  return (
    <AuthShell title="Let's create your" accent="account." sub="Free for companies and owners. Takes under a minute.">
      <h2 className="mb-6 text-3xl font-black">Get started</h2>
      <AuthForm mode="signup" role={typeof role === "string" ? role : undefined} />
      <p className="mt-6 text-center text-sm text-muted">Already have an account? <Link href="/login" className="font-bold text-brand">Sign in</Link></p>
    </AuthShell>
  );
}
