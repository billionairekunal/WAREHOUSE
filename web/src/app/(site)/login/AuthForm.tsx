"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowRight, Building2, CheckCircle2, Eye, EyeOff, Warehouse } from "lucide-react";
import { signIn, signUp } from "@/app/actions";
import { useT } from "@/lib/i18n/client";

export function AuthForm({ mode, next, role: initialRole }: { mode: "login" | "signup"; next?: string; role?: string }) {
  const { t } = useT();
  const [state, action, pending] = useActionState(mode === "login" ? signIn : signUp, null);
  const [role, setRole] = useState(initialRole === "owner" ? "owner" : "tenant");
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState("");
  const score = [pw.length >= 8, /[A-Z]/.test(pw) && /[a-z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw) || pw.length >= 14].filter(Boolean).length;
  const strength = [t("a.s0"), t("a.s1"), t("a.s2"), t("a.s3"), t("a.s4")][pw.length < 8 ? 0 : score];
  const barColor = ["bg-danger", "bg-danger", "bg-amber", "bg-sky", "bg-mint"][pw.length < 8 ? 0 : score];

  if (state?.ok && state.message) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-success" />
        <h2 className="mt-3 text-xl font-extrabold">{t("a.almost")}</h2>
        <p className="mt-2 text-muted">{state.message}</p>
        <Link href="/login" className="btn btn-primary mt-6">{t("a.goSignin")}</Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      {mode === "signup" && (
        <>
          <fieldset>
            <legend className="label">{t("a.iwant")}</legend>
            <div className="grid grid-cols-2 gap-2">
              {([["tenant", Building2, t("a.find"), t("a.forCompanies")], ["owner", Warehouse, t("a.list"), t("a.forOwners")]] as const).map(([v, Icon, title, d]) => (
                <label key={v} className={`cursor-pointer rounded-3xl border-2 p-4 transition ${role === v ? "border-brand bg-ice/40" : "border-line bg-white hover:border-sky"}`}>
                  <input type="radio" name="role" value={v} checked={role === v} onChange={() => setRole(v)} className="sr-only" />
                  <Icon className={`size-6 ${role === v ? "text-brand" : "text-muted"}`} />
                  <p className="mt-2 font-extrabold">{title}</p>
                  <p className="text-xs text-muted">{d}</p>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="label">{t("a.fullName")}</span><input name="full_name" required autoComplete="name" className="field" placeholder={t("a.namePh")} /></label>
            <label><span className="label">{t("a.phone")}</span><input name="phone" type="tel" pattern="[0-9+ ]{10,15}" autoComplete="tel" className="field" placeholder="+91 98xxxxxx" /></label>
          </div>
          <label className="block"><span className="label">{role === "owner" ? t("a.ownerCompany") : t("a.company")}</span>
            <input name="company_name" required autoComplete="organization" className="field" placeholder={t("a.companyPh")} /></label>
        </>
      )}
      <label className="block"><span className="label">{t("a.email")}</span>
        <input name="email" type="email" required autoComplete="email" className="field" placeholder="you@company.com" /></label>
      <label className="block"><span className="label">{t("a.password")}</span>
        <span className="relative block">
          <input name="password" type={show ? "text" : "password"} required minLength={mode === "signup" ? 8 : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"} value={pw} onChange={(e) => setPw(e.target.value)} className="field pr-12" placeholder={mode === "signup" ? t("a.pwPh") : "••••••••"} />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? t("a.hide") : t("a.show")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </span>
      </label>
      {mode === "signup" && pw && (
        <div aria-live="polite">
          <div className="flex justify-between text-xs font-semibold"><span className="text-muted">{t("a.strength")}</span><span>{strength}</span></div>
          <div className="mt-1.5 grid grid-cols-4 gap-1.5">{[1, 2, 3, 4].map((n) => <span key={n} className={`h-1.5 rounded-full ${n <= (pw.length < 8 ? 0 : score) ? barColor : "bg-line"}`} />)}</div>
        </div>
      )}
      {state && !state.ok && <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{state.error}</p>}
      <button disabled={pending} className="btn btn-primary btn-arrow w-full !justify-between !py-2 !pl-6 text-base">
        {pending ? t("a.wait") : mode === "login" ? t("a.signin") : t("a.createBtn")}
        <span className="bubble"><ArrowRight className="size-4" /></span>
      </button>
      {mode === "signup" && <p className="text-center text-xs text-muted">{t("a.terms")}</p>}
    </form>
  );
}
