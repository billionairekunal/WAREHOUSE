import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "./AuthShell";
import { AuthForm } from "./AuthForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  return (
    <AuthShell title="Welcome" accent="back." sub="Sign in to manage quotes, visits and listings.">
      <h2 className="mb-6 text-3xl font-black">Sign in</h2>
      {error === "link" && <p role="alert" className="mb-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">That email link has expired or was already used. Sign in below, or sign up again to get a new link.</p>}
      <AuthForm mode="login" next={typeof next === "string" ? next : undefined} />
      <p className="mt-6 text-center text-sm text-muted">New here? <Link href="/signup" className="font-bold text-brand">Create an account</Link></p>
    </AuthShell>
  );
}
