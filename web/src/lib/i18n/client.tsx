"use client";
import { createContext, useContext, useMemo } from "react";
import { makeT, type Lang, type Messages, type T } from "./index";

const Ctx = createContext<{ lang: Lang; t: T } | null>(null);

/** Gives client components the active language's strings (only that language is sent to the browser). */
export function LangProvider({ lang, messages, children }: { lang: Lang; messages: Messages; children: React.ReactNode }) {
  const value = useMemo(() => ({ lang, t: makeT(messages) }), [lang, messages]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useT must be used inside LangProvider");
  return v;
}
