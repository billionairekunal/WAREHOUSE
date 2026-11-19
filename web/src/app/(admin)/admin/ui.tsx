"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { CalendarClock, ClipboardCheck, FileText, LayoutDashboard, Loader2, Users, Warehouse } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/approvals", label: "Approvals", icon: ClipboardCheck, badge: "pending" },
  { href: "/admin/listings", label: "Listings", icon: Warehouse },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/quotes", label: "Quotes", icon: FileText },
  { href: "/admin/visits", label: "Site visits", icon: CalendarClock },
] as const;

/** Sidebar links (desktop) and scrolling tabs (phones). */
export function AdminNav({ pending, variant }: { pending: number; variant: "side" | "tabs" }) {
  const path = usePathname();
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  if (variant === "tabs") {
    return (
      <nav aria-label="Admin sections" className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-3">
        {NAV.map(({ href, label, icon: Icon, ...rest }) => (
          <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold ${active(href) ? "bg-white text-navy" : "bg-white/10 text-ice"}`}>
            <Icon className="size-4" /> {label}
            {"badge" in rest && pending > 0 && <span className="rounded-full bg-lime px-1.5 text-[11px] text-ink">{pending}</span>}
          </Link>
        ))}
      </nav>
    );
  }
  return (
    <nav aria-label="Admin sections" className="space-y-1">
      {NAV.map(({ href, label, icon: Icon, ...rest }) => (
        <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${active(href) ? "bg-white text-navy shadow" : "text-ice/80 hover:bg-white/10 hover:text-white"}`}>
          <Icon className="size-[18px]" /> {label}
          {"badge" in rest && pending > 0 && <span className="ml-auto grid min-w-6 place-items-center rounded-full bg-lime px-1.5 text-xs text-ink">{pending}</span>}
        </Link>
      ))}
    </nav>
  );
}

/** Runs a bound server action; optional confirm; shows a spinner; reports errors. */
export function ActionButton({ action, confirm, className = "", children, title }: {
  action: () => Promise<void>; confirm?: string; className?: string; children: React.ReactNode; title?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button type="button" title={title} disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => { try { await action(); } catch (e) { alert((e as Error).message); } });
      }}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition disabled:opacity-60 ${className}`}>
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}{children}
    </button>
  );
}

/** Dropdown that saves immediately via a bound server action. */
export function StatusSelect({ action, value, options, label }: {
  action: (v: string) => Promise<void>; value: string; options: readonly string[]; label: string;
}) {
  const [pending, start] = useTransition();
  return (
    <span className="relative inline-flex items-center">
      <select aria-label={label} defaultValue={value} disabled={pending}
        onChange={(e) => { const v = e.target.value; start(async () => { try { await action(v); } catch (err) { alert((err as Error).message); } }); }}
        className="rounded-full border border-line bg-white py-1.5 pl-3 pr-7 text-xs font-bold capitalize outline-none focus:border-sky disabled:opacity-60">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {pending && <Loader2 className="pointer-events-none absolute right-2 size-3.5 animate-spin text-muted" />}
    </span>
  );
}

/** "Request changes" with an inline reason box. */
export function RequestChanges({ action }: { action: (reason: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="rounded-full border border-line bg-white px-4 py-2.5 text-sm font-bold hover:border-coral hover:text-coral">Request changes</button>;
  return (
    <div className="w-full rounded-2xl bg-surface p-3">
      <label className="label" htmlFor="reason">What should the owner fix?</label>
      <textarea id="reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500}
        placeholder="e.g. Upload a clear photo of the docks and the Fire NOC certificate" className="field resize-none !bg-white" />
      <div className="mt-2 flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-4 py-2 text-sm font-bold text-muted">Cancel</button>
        <button type="button" disabled={pending || !reason.trim()}
          onClick={() => start(async () => { await action(reason); setOpen(false); })}
          className="rounded-full bg-coral px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{pending ? "Sending…" : "Send to owner"}</button>
      </div>
    </div>
  );
}

/** Search box + filter chips that write to the URL. */
export function TableFilters({ statuses, param = "status", placeholder }: { statuses: readonly string[]; param?: string; placeholder?: string }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const current = sp.get(param) ?? "";
  const set = (k: string, v: string) => {
    const q = new URLSearchParams(sp);
    if (v) q.set(k, v); else q.delete(k);
    router.push(`${path}?${q}`);
  };
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
        {["", ...statuses].map((s) => (
          <button key={s || "all"} type="button" onClick={() => set(param, s)} data-active={current === s}
            className="chip shrink-0 !py-1.5 capitalize">{s || "All"}</button>
        ))}
      </div>
      {placeholder && (
        <form onSubmit={(e) => { e.preventDefault(); set("q", String(new FormData(e.currentTarget).get("q") ?? "").trim()); }} className="sm:w-72">
          <input name="q" key={sp.get("q") ?? ""} defaultValue={sp.get("q") ?? ""} placeholder={placeholder}
            className="field !rounded-full !py-2.5 text-sm" />
        </form>
      )}
    </div>
  );
}
