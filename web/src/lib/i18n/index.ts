import { DICTS, type Key } from "./dict";

export const LANGS = ["en", "hi", "mr"] as const;
export type Lang = (typeof LANGS)[number];
export type { Key };
export const LANG_LABEL: Record<Lang, string> = { en: "English", hi: "हिन्दी", mr: "मराठी" };
export const LANG_COOKIE = "lang";
/** Locale for dates: Devanagari month names, Western digits. */
export const DATE_LOCALE: Record<Lang, string> = { en: "en-IN", hi: "hi-IN-u-nu-latn", mr: "mr-IN-u-nu-latn" };

export const isLang = (v: unknown): v is Lang => LANGS.includes(v as Lang);
export type Messages = Record<Key, string>;
export const messagesFor = (lang: Lang): Messages => DICTS[lang];

/** t("home.listed", { n: 5 }) → "5 listed" */
export function makeT(messages: Messages) {
  return (key: Key, vars?: Record<string, string | number>) => {
    let s = messages[key] ?? DICTS.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
}
export type T = ReturnType<typeof makeT>;

/** Storage type (English DB value) → translation key for its short label. */
export const TYPE_KEY: Record<string, Key> = {
  "General / Dry storage": "type.dry", "Cold storage": "type.cold", "Climate-controlled": "type.climate",
  "E-commerce fulfillment": "type.ecom", "3PL": "type.3pl", "Cross-docking": "type.crossdock", Hazmat: "type.hazmat",
  "Pharma-grade": "type.pharma", "Food grade": "type.food", "Bonded / SEZ": "type.bonded", "Auto parts": "type.auto", "Open yard": "type.yard",
};
