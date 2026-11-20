"use client";
import { useActionState, useState } from "react";
import { ArrowRight, Building2, Lock, Warehouse } from "lucide-react";
import { completeProfile } from "@/app/actions";
import { useT } from "@/lib/i18n/client";

type P = { next: string; email: string; name: string; phone: string; company: string; role: "tenant" | "owner" };

export function ProfileForm({ next, email, name, phone, company, role: initialRole }: P) {
  const { t } = useT();
  const [state, action, pending] = useActionState(completeProfile, null);
  const [role, setRole] = useState(initialRole);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
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
      <label className="block"><span className="label">{t("a.fullName")} *</span>
        <input name="full_name" required defaultValue={name} autoComplete="name" className="field" placeholder={t("a.namePh")} /></label>
      <label className="block"><span className="label">{t("o.mobile")} *</span>
        <input name="phone" type="tel" required defaultValue={phone} pattern="[0-9+ \-]{10,16}" autoComplete="tel" inputMode="tel" className="field" placeholder="+91 98xxxxxxxx" /></label>
      <label className="block"><span className="label">{t("a.email")}</span>
        <span className="relative block"><input value={email} readOnly className="field cursor-not-allowed pr-11 text-muted" /><Lock className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted" /></span></label>
      <label className="block"><span className="label">{role === "owner" ? t("a.ownerCompany") : t("a.company")} *</span>
        <input name="company_name" required defaultValue={company} autoComplete="organization" className="field" placeholder={t("a.companyPh")} /></label>
      {state && !state.ok && <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{state.error}</p>}
      <button disabled={pending} className="btn btn-primary btn-arrow w-full !justify-between !py-2 !pl-6 text-base">
        {pending ? t("a.wait") : t("o.save")}
        <span className="bubble"><ArrowRight className="size-4" /></span>
      </button>
    </form>
  );
}
