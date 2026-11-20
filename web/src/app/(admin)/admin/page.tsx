import Link from "next/link";
import { ArrowRight, CalendarClock, ClipboardCheck, FileText, Users, Warehouse } from "lucide-react";
import { requireAdminPage } from "@/lib/admin";
import { Badge, PageHead, when } from "./shared";

export default async function AdminOverview() {
  const { supabase } = await requireAdminPage();
  const [listings, profiles, quotes, visits] = await Promise.all([
    supabase.from("listings").select("id,name,status,verified,created_at,micro_market").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id,role,full_name,company_name,created_at").order("created_at", { ascending: false }),
    supabase.from("quotes").select("id,status,created_at,tenant_company,listing:listings(name)").order("created_at", { ascending: false }),
    supabase.from("visits").select("id,status,scheduled_at,created_at,tenant_company,listing:listings(name)").order("created_at", { ascending: false }),
  ]);
  const L = listings.data ?? [], P = profiles.data ?? [], Q = quotes.data ?? [], V = visits.data ?? [];
  const by = <T extends Record<string, unknown>>(rows: T[], k: keyof T) =>
    rows.reduce<Record<string, number>>((a, r) => { const v = String(r[k]); a[v] = (a[v] ?? 0) + 1; return a; }, {});
  const ls = by(L, "status"), roles = by(P, "role"), qs = by(Q, "status"), vs = by(V, "status");
  const dealTodo = (qs.pending_review ?? 0) + (qs.owner_quoted ?? 0) + (qs.counter_review ?? 0) + (qs.accepted ?? 0);
  const visitTodo = (vs.pending_review ?? 0) + (vs.owner_responded ?? 0);
  const name = (x: unknown) => (x as { name?: string } | null)?.name ?? "—";

  const tiles = [
    { label: "Awaiting approval", value: ls.submitted ?? 0, icon: ClipboardCheck, tint: "bg-lime text-ink", href: "/admin/approvals", hot: (ls.submitted ?? 0) > 0 },
    { label: "Live listings", value: ls.live ?? 0, icon: Warehouse, tint: "bg-mint/10 text-mint", href: "/admin/listings?status=live" },
    { label: "Users", value: P.length, icon: Users, tint: "bg-brand/10 text-brand", href: "/admin/users" },
    { label: "Deals need action", value: dealTodo, icon: FileText, tint: "bg-amber/15 text-amber", href: "/admin/quotes", hot: dealTodo > 0 },
    { label: "Visits need action", value: visitTodo, icon: CalendarClock, tint: "bg-coral/10 text-coral", href: "/admin/visits", hot: visitTodo > 0 },
  ];

  const activity = [
    ...L.slice(0, 6).map((l) => ({ at: l.created_at, text: `Listing “${l.name}” created`, tag: l.status, href: "/admin/listings" })),
    ...Q.slice(0, 6).map((q) => ({ at: q.created_at, text: `${q.tenant_company ?? "A company"} requested a quote for ${name(q.listing)}`, tag: q.status, href: "/admin/quotes" })),
    ...V.slice(0, 6).map((v) => ({ at: v.created_at, text: `${v.tenant_company ?? "A company"} booked a visit to ${name(v.listing)}`, tag: v.status, href: "/admin/visits" })),
    ...P.slice(0, 6).map((p) => ({ at: p.created_at, text: `${p.full_name ?? "Someone"} joined${p.company_name ? ` (${p.company_name})` : ""}`, tag: p.role, href: "/admin/users" })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 10);

  return (
    <>
      <PageHead title="Overview" sub="Everything happening on the platform, at a glance." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {tiles.map(({ label, value, icon: Icon, tint, href, hot }) => (
          <Link key={label} href={href} className={`group rounded-[1.5rem] bg-white p-4 shadow-[var(--shadow-soft)] ring-1 transition hover:-translate-y-0.5 ${hot ? "ring-lime-deep" : "ring-line"}`}>
            <span className={`tile-icon size-10 ${tint}`}><Icon className="size-5" /></span>
            <p className="display mt-4 text-4xl font-black">{value}</p>
            <p className="mt-0.5 flex items-center justify-between text-xs font-semibold text-muted">{label} <ArrowRight className="size-3.5 opacity-0 transition group-hover:opacity-100" /></p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="rounded-[1.5rem] bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-line">
          <h2 className="text-lg font-extrabold">Breakdown</h2>
          {[["Listings", ls], ["Users", roles], ["Deals", qs], ["Site visits", vs]].map(([title, counts]) => (
            <div key={title as string} className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">{title as string}</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(counts as Record<string, number>).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                  <span key={k} className="inline-flex items-center gap-1.5"><Badge s={k} /><b className="text-sm">{v}</b></span>
                ))}
                {!Object.keys(counts as object).length && <span className="text-sm text-muted">None yet</span>}
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-[1.5rem] bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-line">
          <h2 className="text-lg font-extrabold">Recent activity</h2>
          <ul className="mt-3 divide-y divide-line">
            {activity.map((a, i) => (
              <li key={i}>
                <Link href={a.href} className="flex items-center gap-3 py-3 hover:text-brand">
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{a.text}</span><span className="text-xs text-muted">{when(a.at, true)}</span></span>
                  <Badge s={a.tag} />
                </Link>
              </li>
            ))}
            {!activity.length && <li className="py-6 text-center text-sm text-muted">No activity yet.</li>}
          </ul>
        </section>
      </div>
    </>
  );
}
