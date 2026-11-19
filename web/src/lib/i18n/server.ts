import { cookies } from "next/headers";
import { cache } from "react";
import { LANG_COOKIE, isLang, makeT, messagesFor, type Lang } from "./index";

/** Current language from the cookie (English by default). Cached per request. */
export const getLang = cache(async (): Promise<Lang> => {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : "en";
});

export const getT = cache(async () => {
  const lang = await getLang();
  return { lang, t: makeT(messagesFor(lang)) };
});
