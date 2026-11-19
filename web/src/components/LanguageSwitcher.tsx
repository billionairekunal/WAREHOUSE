"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, Languages, Loader2 } from "lucide-react";
import { setLang } from "@/app/actions";
import { LANGS, LANG_LABEL, type Lang } from "@/lib/i18n";
import { useT } from "@/lib/i18n/client";

const SHORT: Record<Lang, string> = { en: "EN", hi: "हि", mr: "म" };

/** Globe button in the header: English / हिन्दी / मराठी. Choice is saved in a cookie. */
export function LanguageSwitcher() {
  const { lang, t } = useT();
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <details data-menu className="relative">
      <summary aria-label={t("nav.language")} title={t("nav.language")}
        className="flex h-10 cursor-pointer list-none items-center gap-1 rounded-full px-2.5 text-sm font-bold text-ink hover:bg-white [&::-webkit-details-marker]:hidden">
        {pending ? <Loader2 className="size-[18px] animate-spin" /> : <Languages className="size-[18px]" />}
        <span>{SHORT[lang]}</span>
      </summary>
      <div className="card absolute right-0 mt-3 w-48 p-2 text-sm">
        <p className="px-3 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wider text-muted">{t("nav.language")}</p>
        {LANGS.map((l) => (
          <button key={l} type="button" disabled={pending} lang={l}
            onClick={(e) => {
              (e.currentTarget.closest("details") as HTMLDetailsElement).open = false;
              if (l === lang) return;
              start(async () => { await setLang(l); router.refresh(); });
            }}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left font-semibold hover:bg-surface ${l === lang ? "text-brand" : ""}`}>
            {LANG_LABEL[l]} {l === lang && <Check className="size-4" />}
          </button>
        ))}
      </div>
    </details>
  );
}
