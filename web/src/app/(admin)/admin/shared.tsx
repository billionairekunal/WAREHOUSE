/** Server-side bits shared by admin pages. */
export const STATUS_STYLE: Record<string, string> = {
  draft: "bg-line text-muted", submitted: "bg-amber/15 text-amber", live: "bg-mint/10 text-mint", leased: "bg-navy/10 text-navy",
  rejected: "bg-coral/10 text-coral", paused: "bg-line text-muted",
  requested: "bg-ice text-royal", quoted: "bg-brand/10 text-brand", negotiating: "bg-amber/15 text-amber", accepted: "bg-mint/10 text-mint",
  withdrawn: "bg-line text-muted", expired: "bg-line text-muted", confirmed: "bg-mint/10 text-mint", done: "bg-navy/10 text-navy",
  cancelled: "bg-line text-muted", tenant: "bg-brand/10 text-brand", owner: "bg-amber/15 text-amber", admin: "bg-lime text-ink",
};

export function Badge({ s, label }: { s: string; label?: string }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_STYLE[s] ?? "bg-line"}`}>{label ?? (s === "submitted" ? "awaiting review" : s === "tenant" ? "company" : s)}</span>;
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-black sm:text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export const when = (iso: string | null | undefined, withTime = false) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}), timeZone: "Asia/Kolkata" }) : "—";

export const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
/** Text safe to drop into a PostgREST ilike/or filter. */
export const safeSearch = (v: string) => v.replace(/[%_,().*"\\:]/g, " ").trim().slice(0, 60);

export function Empty({ text }: { text: string }) {
  return <div className="rounded-[1.5rem] bg-white px-6 py-14 text-center text-sm font-semibold text-muted ring-1 ring-line">{text}</div>;
}
