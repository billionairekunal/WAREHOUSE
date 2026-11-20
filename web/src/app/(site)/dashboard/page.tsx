import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock, CheckCircle2, FileText, Heart, LayoutGrid, Plus, Settings2, Trophy, Warehouse,
} from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import { CARD_FIELDS, type CardListing, costBreakdown, date, img, inr, sqft } from "@/lib/data";
import { ListingCard } from "@/components/ListingCard";
import { EnablePush } from "@/components/EnablePush";
import { ListingToggle, OwnerRespond, OwnerVisitActions, TenantQuoteActions, TenantVisitCancel } from "./Actions";

export const metadata: Metadata = { title: "Dashboard" };

type Quote = {
  id: string; status: string; area_sqft: number; move_in: string | null; tenure_months: number | null; tenant_note: string | null;
  rent_psf: number | null; cam_psf: number | null; deposit_months: number | null; lock_in_months: number | null;
  escalation_pct: number | null; rent_free_days: number | null; valid_until: string | null; owner_note: string | null;
  counter_rent_psf: number | null; tenant_name: string | null; tenant_company: string | null; created_at: string;
  listing: { id: string; name: string; micro_market: string | null; photos: string[] } | null;
};
/** What an owner sees of a request: no company name, no contact. */
type Offer = {
  id: string; status: string; area_sqft: number; move_in: string | null; tenure_months: number | null; requirements: string | null;
  counter_rent_psf: number | null; rent_psf: number | null; created_at: string; listing: { id: string; name: string; micro_market: string | null } | null;
};
type Visit = { id: string; status: string; scheduled_at: string; owner_note?: string | null; listing: { id: string; name: string; micro_market: string | null } | null };

const STATUS: Record<string, string> = {
  requested: "bg-ice/60 text-royal", quoted: "bg-brand/10 text-brand", negotiating: "bg-warn/10 text-warn",
  accepted: "bg-success/10 text-success", rejected: "bg-danger/10 text-danger", withdrawn: "bg-line text-muted", expired: "bg-line text-muted",
  won: "bg-lime text-ink", pending_review: "bg-ice/60 text-royal", owner_quoted: "bg-ice/60 text-royal", counter_review: "bg-warn/10 text-warn",
  owner_responded: "bg-ice/60 text-royal", approved: "bg-success/10 text-success", declined: "bg-line text-muted", closed: "bg-line text-muted",
  available: "bg-success/10 text-success", unavailable: "bg-line text-muted",
  confirmed: "bg-success/10 text-success", done: "bg-line text-muted", cancelled: "bg-line text-muted",
  draft: "bg-line text-muted", submitted: "bg-warn/10 text-warn", live: "bg-success/10 text-success", paused: "bg-line text-muted", leased: "bg-navy/10 text-navy",
};
const STAT_STYLE = [[Heart, ""], [FileText, "bg-amber/15 text-amber"], [Trophy, "bg-brand/10 text-brand"], [CheckCircle2, "bg-mint/10 text-mint"]] as const;
/** Companies never see the internal back-and-forth; owners see their side only. */
const COMPANY_LABEL: Record<string, string> = {
  pending_review: "Getting quotes", requested: "Getting quotes", owner_quoted: "Getting quotes", quoted: "Quote ready", counter_review: "Negotiating",
  negotiating: "Negotiating", won: "Deal closed", owner_responded: "Awaiting confirmation", submitted: "In review",
};
const OWNER_LABEL: Record<string, string> = {
  requested: "New enquiry", owner_quoted: "Platform reviewing", negotiating: "Counter-offer", approved: "Sent to company", closed: "Closed",
  available: "You can host", unavailable: "Not available", confirmed: "Visit confirmed", cancelled: "Cancelled",
};
const Badge = ({ s, owner }: { s: string; owner?: boolean }) => <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS[s] ?? "bg-line"}`}>{(owner ? OWNER_LABEL[s] : COMPANY_LABEL[s]) ?? s}</span>;
const AWAITING = ["pending_review", "requested", "owner_responded"];

export default async function Dashboard({ searchParams }: PageProps<"/dashboard">) {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect("/login?next=/dashboard");
  const sp = await searchParams;
  const isOwner = profile?.role === "owner" || profile?.role === "admin";
  const QSEL = "*, listing:listings(id,name,micro_market,photos)";

  const LSEL = "listing:listings(id,name,micro_market)";
  const [myQuotes, incoming, visits, hosting, favs, mine] = await Promise.all([
    supabase.from("quotes").select(QSEL).eq("tenant_id", user.id).order("created_at", { ascending: false }),
    isOwner ? supabase.from("quote_offers").select(`id,status,area_sqft,move_in,tenure_months,requirements,counter_rent_psf,rent_psf,created_at,${LSEL}`).eq("owner_id", user.id).order("updated_at", { ascending: false }) : Promise.resolve({ data: [] }),
    supabase.from("visits").select(`id,status,scheduled_at,${LSEL}`).eq("tenant_id", user.id).order("scheduled_at"),
    isOwner ? supabase.from("visit_offers").select(`id,status,scheduled_at,owner_note,${LSEL}`).eq("owner_id", user.id).order("scheduled_at") : Promise.resolve({ data: [] }),
    supabase.from("favorites").select(`listing:listings(${CARD_FIELDS})`).eq("user_id", user.id),
    isOwner ? supabase.from("listings").select("id,name,micro_market,status,verified,photos,area_available,rent_psf,rejection_reason,updated_at").eq("owner_id", user.id).order("updated_at", { ascending: false }) : Promise.resolve({ data: [] }),
  ]);
  const quotes = (myQuotes.data ?? []) as Quote[];
  const requests = (incoming.data ?? []) as unknown as Offer[];
  const myVisits = (visits.data ?? []) as unknown as Visit[];
  const hostVisits = (hosting.data ?? []) as unknown as Visit[];
  const openRequests = requests.filter((r) => ["requested", "negotiating"].includes(r.status)).length;
  const saved = ((favs.data ?? []) as unknown as { listing: CardListing | null }[]).map((f) => f.listing).filter(Boolean) as CardListing[];
  const listings = (mine.data ?? []) as { id: string; name: string; micro_market: string; status: string; verified: boolean; photos: string[]; area_available: number; rent_psf: number; rejection_reason: string | null; updated_at: string }[];

  const tabs = [
    { key: "overview", label: "Overview", icon: LayoutGrid },
    ...(isOwner ? [{ key: "listings", label: "My listings", icon: Warehouse, n: listings.length }, { key: "requests", label: "Enquiries", icon: FileText, n: openRequests }] : []),
    { key: "quotes", label: "My quotes", icon: Trophy, n: quotes.filter((q) => q.status === "quoted").length },
    { key: "visits", label: "Site visits", icon: CalendarClock, n: hostVisits.filter((v) => v.status === "requested").length },
    { key: "saved", label: "Saved", icon: Heart, n: saved.length },
  ];
  const tab = tabs.some((t) => t.key === sp.tab) ? (sp.tab as string) : "overview";

  // Quote comparison: cheapest total cost over lock-in wins.
  const priced = quotes.filter((q) => q.rent_psf).map((q) => ({
    q, c: costBreakdown(q.area_sqft, q.rent_psf!, q.cam_psf ?? 0, q.deposit_months ?? 0, q.lock_in_months || 12, q.escalation_pct ?? 0),
  }));
  const bestId = priced.filter((p) => ["quoted", "counter_review", "negotiating"].includes(p.q.status)).sort((a, b) => a.c.total / a.q.area_sqft - b.c.total / b.q.area_sqft)[0]?.q.id;

  const stats = isOwner
    ? [["Live listings", listings.filter((l) => l.status === "live").length], ["Open enquiries", openRequests], ["Quotes sent", requests.filter((r) => ["owner_quoted", "approved"].includes(r.status)).length], ["Visit requests", hostVisits.filter((v) => v.status === "requested").length]]
    : [["Saved spaces", saved.length], ["Getting quotes", quotes.filter((q) => ["pending_review", "requested", "owner_quoted"].includes(q.status)).length], ["Quotes ready", quotes.filter((q) => ["quoted", "counter_review", "negotiating"].includes(q.status)).length], ["Accepted", quotes.filter((q) => ["accepted", "won"].includes(q.status)).length]];

  return (
    <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted">{isOwner ? "Owner workspace" : "Company procurement workspace"} · {profile?.company_name}</p>
          <h1 className="mt-2 text-4xl font-black sm:text-6xl">Hello, <span className="hl">{profile?.full_name?.split(" ")[0] || "there"}</span> 👋</h1>
        </div>
        {isOwner
          ? <Link href="/list-space" className="btn btn-primary"><Plus className="size-4" /> List new space</Link>
          : <Link href="/search" className="btn btn-primary">Find space</Link>}
      </div>
      {sp.submitted && <p className="mt-5 flex items-center gap-2 rounded-2xl bg-success/10 px-4 py-3 text-sm font-semibold text-success"><CheckCircle2 className="size-5" /> Listing submitted. Our team will review it and schedule a site visit.</p>}

      <div className="mt-5"><EnablePush isOwner={isOwner} /></div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Dashboard sections" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
          {tabs.map(({ key, label, icon: Icon, n }) => (
            <Link key={key} href={`/dashboard?tab=${key}`} aria-current={tab === key ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${tab === key ? "bg-navy text-white shadow-[var(--shadow-lift)]" : "bg-white text-muted hover:text-ink lg:bg-transparent"}`}>
              <Icon className="size-[18px]" /> {label}
              {!!n && <span className={`ml-auto grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] ${tab === key ? "bg-white/20" : "bg-ice text-royal"}`}>{n}</span>}
            </Link>
          ))}
          <span className="hidden items-center gap-3 px-4 py-3 text-sm font-bold text-muted/60 lg:flex"><Settings2 className="size-[18px]" /> Settings <span className="ml-auto text-[10px]">soon</span></span>
        </nav>

        <div className="min-w-0 space-y-6">
          {tab === "overview" && (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map(([k, v], i) => {
                  const [Icon, tint] = STAT_STYLE[i];
                  return (
                    <div key={k as string} className={`noise relative overflow-hidden rounded-[1.75rem] p-5 ${i === 0 ? "navy-glow text-white shadow-[var(--shadow-lift)]" : "border border-white bg-white/90 shadow-[var(--shadow-soft)]"}`}>
                      <span className={`tile-icon ${i === 0 ? "bg-lime text-ink" : tint}`}><Icon className="size-5" /></span>
                      <p className="display mt-5 text-5xl font-black">{v}</p>
                      <p className={`mt-1 text-sm font-semibold ${i === 0 ? "text-ice/80" : "text-muted"}`}>{k}</p>
                    </div>
                  );
                })}
              </div>
              {isOwner ? <RequestsList requests={requests.slice(0, 4)} title="Latest enquiries" /> : <QuotesTable quotes={quotes.slice(0, 5)} bestId={bestId} priced={priced} />}
              <VisitsList visits={(isOwner ? hostVisits : myVisits).filter((v) => new Date(v.scheduled_at) > new Date()).slice(0, 4)} owner={isOwner} />
            </>
          )}
          {tab === "quotes" && <QuotesTable quotes={quotes} bestId={bestId} priced={priced} />}
          {tab === "requests" && <RequestsList requests={requests} title="Enquiries from the platform" />}
          {tab === "visits" && (
            <>
              {isOwner && <VisitsList visits={hostVisits} owner />}
              {(!isOwner || myVisits.length > 0) && <VisitsList visits={myVisits} />}
            </>
          )}
          {tab === "saved" && (
            saved.length
              ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{saved.map((l) => <ListingCard key={l.id} l={l} saved />)}</div>
              : <Empty icon={Heart} title="No saved spaces yet" text="Tap the heart on any listing to shortlist it here." href="/search" cta="Browse spaces" />
          )}
          {tab === "listings" && (
            listings.length ? (
              <ul className="grid gap-4 sm:grid-cols-2">
                {listings.map((l) => (
                  <li key={l.id} className="card flex gap-4 p-3">
                    <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-ice sm:size-28">
                      {l.photos[0] && <Image src={img(l.photos[0], 300)} alt="" fill sizes="112px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1 py-1">
                      <div className="flex items-start justify-between gap-2"><p className="truncate font-extrabold">{l.name || "Untitled draft"}</p><Badge s={l.status} /></div>
                      <p className="text-sm text-muted">{l.micro_market ?? "—"} · {sqft(l.area_available)} · ₹{l.rent_psf ?? "—"}/sq ft</p>
                      {l.status === "rejected" && <p className="mt-1 text-xs font-semibold text-danger">Changes requested: {l.rejection_reason}</p>}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Link href={`/list-space?id=${l.id}`} className="btn btn-ghost !px-3 !py-1.5 text-xs">Edit</Link>
                        {["live", "leased"].includes(l.status) && <Link href={`/warehouse/${l.id}`} className="btn btn-ghost !px-3 !py-1.5 text-xs">View</Link>}
                        <ListingToggle id={l.id} status={l.status} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <Empty icon={Warehouse} title="No listings yet" text="List your first warehouse in about 10 minutes. It's free." href="/list-space" cta="List a space" />
          )}
        </div>
      </div>
    </main>
  );
}

function QuotesTable({ quotes, bestId, priced }: { quotes: Quote[]; bestId?: string; priced: { q: Quote; c: ReturnType<typeof costBreakdown> }[] }) {
  if (!quotes.length) return <Empty icon={FileText} title="No quotes yet" text="Request a quote from any listing. Our team gets you the best terms, usually within 24 hours." href="/search" cta="Find space" />;
  const cost = new Map(priced.map((p) => [p.q.id, p.c]));
  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-2 p-5 pb-3">
        <div><h2 className="text-2xl font-extrabold">Quotes awaiting decision</h2><p className="text-sm text-muted">Compared on monthly outgo incl. GST and total cost over the lock-in period.</p></div>
      </div>
      {/* desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-surface text-left text-xs font-bold uppercase tracking-wide text-muted">
            <tr>{["Warehouse", "Area", "Rent", "Monthly (incl. GST)", "Deposit", "Lock-in", "Total cost", "Valid until", "Status", ""].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody>
            {quotes.map((q) => {
              const c = cost.get(q.id);
              return (
                <tr key={q.id} className={`border-t border-line align-middle ${q.id === bestId ? "bg-success/5" : ""}`}>
                  <td className="px-4 py-3">
                    <Link href={`/warehouse/${q.listing?.id}`} className="font-bold hover:text-brand">{q.listing?.name}</Link>
                    {q.id === bestId && <span className="ml-2 rounded-full bg-success px-2 py-0.5 text-[10px] font-bold text-white">Best value</span>}
                    <p className="text-xs text-muted">{q.listing?.micro_market}</p>
                  </td>
                  <td className="px-4 py-3">{sqft(q.area_sqft)}</td>
                  <td className="px-4 py-3 font-bold">{q.rent_psf ? `₹${q.rent_psf}` : "—"}{q.counter_rent_psf && <p className="text-xs font-semibold text-warn">You: ₹{q.counter_rent_psf}</p>}</td>
                  <td className="px-4 py-3">{c ? inr(c.monthly) : "—"}</td>
                  <td className="px-4 py-3">{c ? inr(c.deposit) : "—"}</td>
                  <td className="px-4 py-3">{q.lock_in_months != null ? `${q.lock_in_months} mo` : "—"}</td>
                  <td className="px-4 py-3 font-extrabold text-brand">{c ? inr(c.total) : "—"}</td>
                  <td className="px-4 py-3">{date(q.valid_until)}</td>
                  <td className="px-4 py-3"><Badge s={q.status} /></td>
                  <td className="px-4 py-3"><TenantQuoteActions id={q.id} status={q.status} rent={q.rent_psf} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* mobile cards */}
      <ul className="divide-y divide-line md:hidden">
        {quotes.map((q) => {
          const c = cost.get(q.id);
          return (
            <li key={q.id} className={`p-5 ${q.id === bestId ? "bg-success/5" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div><Link href={`/warehouse/${q.listing?.id}`} className="font-extrabold">{q.listing?.name}</Link><p className="text-xs text-muted">{sqft(q.area_sqft)} · {q.listing?.micro_market}</p></div>
                <Badge s={q.status} />
              </div>
              {c && (
                <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  {[["Rent", `₹${q.rent_psf}`], ["Monthly", inr(c.monthly)], ["Total", inr(c.total)]].map(([k, v]) => (
                    <div key={k} className="rounded-2xl bg-surface p-2.5"><dt className="text-muted">{k}</dt><dd className="font-extrabold">{v}</dd></div>
                  ))}
                </dl>
              )}
              {q.owner_note && <p className="mt-2 text-xs text-muted">“{q.owner_note}”</p>}
              <div className="mt-3"><TenantQuoteActions id={q.id} status={q.status} rent={q.rent_psf} /></div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function RequestsList({ requests, title }: { requests: Offer[]; title: string }) {
  if (!requests.length) return <Empty icon={FileText} title="No enquiries yet" text="Our team sends you enquiries from verified companies. Complete listings with photos and specs get the most." href="/list-space" cta="Improve a listing" />;
  return (
    <section className="card p-5">
      <h2 className="text-2xl font-extrabold">{title}</h2>
      <p className="mt-1 text-sm text-muted">Enquiries come from verified companies through Chakan MIDC Force. Our team shares your quote with them and handles the negotiation.</p>
      <ul className="mt-4 divide-y divide-line">
        {requests.map((q) => (
          <li key={q.id} className="py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-extrabold">A verified company <span className="font-medium text-muted">· {q.listing?.name}</span></p>
                <p className="text-sm text-muted">{sqft(q.area_sqft)} · move-in {date(q.move_in)} · {q.tenure_months ?? "—"} months · {date(q.created_at)}</p>
                {q.requirements && <p className="mt-1 text-sm">“{q.requirements}”</p>}
                {q.status === "negotiating" && q.counter_rent_psf && <p className="mt-1 text-sm font-bold text-warn">Counter-offer: ₹{q.counter_rent_psf}/sq ft{q.rent_psf ? ` (you quoted ₹${q.rent_psf})` : ""}</p>}
                {["owner_quoted", "approved"].includes(q.status) && q.rent_psf && <p className="mt-1 text-sm font-semibold text-brand">Your quote: ₹{q.rent_psf}/sq ft</p>}
              </div>
              <Badge s={q.status} owner />
            </div>
            {["requested", "negotiating"].includes(q.status) && <div className="mt-3"><OwnerRespond q={q} /></div>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function VisitsList({ visits, owner }: { visits: Visit[]; owner?: boolean }) {
  if (!visits.length) {
    return owner
      ? <Empty icon={CalendarClock} title="No visit requests" text="When a company wants to see your space, our team asks you here first." href="/dashboard?tab=listings" cta="My listings" />
      : <Empty icon={CalendarClock} title="No site visits scheduled" text="Book a visit from any listing page." href="/search" cta="Find space" />;
  }
  return (
    <section className="card p-5">
      <h2 className="text-2xl font-extrabold">{owner ? "Visit requests for your spaces" : "My site visits"}</h2>
      {!owner && visits.some((v) => AWAITING.includes(v.status)) && <p className="mt-1 text-sm text-muted">Our team confirms the time with the owner and lets you know.</p>}
      <ul className="mt-4 space-y-3">
        {visits.map((v) => {
          const d = new Date(v.scheduled_at);
          return (
            <li key={v.id} className="flex flex-wrap items-center gap-4 rounded-3xl bg-surface p-3">
              <div className="grid w-16 shrink-0 place-items-center rounded-2xl bg-white py-2 text-center">
                <span className="text-[11px] font-bold uppercase text-brand">{d.toLocaleDateString("en-IN", { month: "short", timeZone: "Asia/Kolkata" })}</span>
                <span className="text-2xl font-extrabold leading-none">{d.toLocaleDateString("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" })}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{v.listing?.name}</p>
                <p className="text-sm text-muted">{d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })} · {owner ? "A verified company" : v.listing?.micro_market}</p>
                {owner && v.owner_note && <p className="text-xs text-muted">Your note: “{v.owner_note}”</p>}
              </div>
              <Badge s={AWAITING.includes(v.status) && !owner ? "owner_responded" : v.status} owner={owner} />
              {owner ? <OwnerVisitActions id={v.id} status={v.status} /> : <TenantVisitCancel id={v.id} status={v.status} />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Empty({ icon: Icon, title, text, href, cta }: { icon: typeof Heart; title: string; text: string; href: string; cta: string }) {
  return (
    <div className="card grid place-items-center px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-ice/60 text-brand"><Icon className="size-6" /></span>
      <h2 className="mt-4 text-lg font-extrabold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>
      <Link href={href} className="btn btn-primary mt-5">{cta}</Link>
    </div>
  );
}
