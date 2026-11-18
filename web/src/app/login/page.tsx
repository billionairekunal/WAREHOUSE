import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "./AuthShell";
import { AuthForm } from "./AuthForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = (await searchParams).next;
  return (
    <AuthShell title="Welcome" accent="back." sub="Sign in to manage quotes, visits and listings.">
      <h2 className="mb-6 text-3xl font-black">Sign in</h2>
      <AuthForm mode="login" next={typeof next === "string" ? next : undefined} />
      <p className="mt-6 text-center text-sm text-muted">New here? <Link href="/signup" className="font-bold text-brand">Create an account</Link></p>
    </AuthShell>
  );
}
