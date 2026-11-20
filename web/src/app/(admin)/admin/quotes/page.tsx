import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, CircleAlert, Clock, IndianRupee, MessageCircle, Phone, Search, Trophy, UserRound, Wallet } from "lucide-react";
import { requireAdminPage } from "@/lib/admin";
import { sqft } from "@/lib/data";
import { closeDeal, forwardCounter, forwardQuote, sendQuote } from "../actions";
import { ActionButton, ActionForm } from "../ui";
import { Badge, Empty, PageHead, str, when } from "../shared";
import { QuoteForm } from "./QuoteForm";

export const metadata: Metadata = { title: "Deals" };

/** Business stages: which internal statuses sit in each tab. */
const TABS = [
  { key: "needs", label: "Needs you", statuses: ["pending_review", "owner_quoted", "counter_review", "accepted"] },
  { key: "owner", label: "Waiting on owner", statuses: ["requested", "negotiating"] },
  { key: "company", label: "Waiting on company", statuses: ["quoted"] },
  { key: "won", label: "Won", statuses: ["won"] },
  { key: "lost", label: "Lost", statuses: ["rejected", "withdrawn", "expired"] },
  { key: "all", label: "All", statuses: [] as string[] },
] as const;
const NEEDS = TABS[0].statuses as readonly string[];
const OPEN = ["pending_review", "requested", "owner_quoted", "quoted", "counter_review", "negotiating", "accepted"];

type Terms = { rent_psf: number | null; cam_psf: number | null; deposit_months: number | null; lock_in_months: number | null; escalation_pct: number | null; rent_free_days: number | null; valid_until: string | null };
type Offer = Terms & { status: string; owner_note: string | null; counter_rent_psf: number | null; requirements: string | null; updated_at: string };
type Row = Terms & {
  id: string; status: string; area_sqft: number; move_in: string | null; tenure_months: number | null; tenant_note: string | null; owner_note: string | null;
  counter_rent_psf: number | null; tenant_company: string | null; tenant_name: string | null; created_at: string; updated_at: string;
  tenant: { phone: string | null } | null;
  listing: { id: string; name: string; micro_market: string | null; rent_psf: number | null; owner: { company_name: string | null; full_name: string | null; phone: string | null } | null } | null;
  offer: Offer | Offer[] | null;
};
type Deal = Row & { o: Offer | null; ask: number | null; margin: number | null; value: number };

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const lakh = (n: number) => (n >= 1e5 ? `₹${(n / 1e5).toFixed(n >= 1e6 ? 1 : 2)} L` : inr(n));
const hoursSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / 36e5;
const age = (iso: string) => { const h = hoursSince(iso); return h < 1 ? "just now" : h < 24 ? `${Math.floor(h)}h` : `${Math.floor(h / 24)}d`; };

export default async function AdminDeals({ searchParams }: PageProps<"/admin/quotes">) {
  const { supabase } = await requireAdminPage();
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === str(sp.tab)) ?? TABS[0];
  const q = str(sp.q).trim().toLowerCase();

  // ponytail: loads the latest 500 deals and filters in memory; move filters into SQL past a few thousand deals
  const { data } = await supabase.from("quotes")
    .select("*, tenant:profiles!quotes_tenant_id_fkey(phone), listing:listings(id,name,micro_market,rent_psf,owner:profiles!listings_owner_id_fkey(company_name,full_name,phone)), offer:quote_offers(*)")
    .order("updated_at", { ascending: false }).limit(500);
  const all: Deal[] = ((data ?? []) as unknown as Row[]).map((r) => {
    const o = Array.isArray(r.offer) ? r.offer[0] ?? null : r.offer;
    const ask = o?.rent_psf ?? null;
    const rent = r.rent_psf ?? r.listing?.rent_psf ?? 0;
    return { ...r, o, ask, margin: ask != null && r.rent_psf != null ? r.rent_psf - ask : null, value: rent * r.area_sqft };
  });

  // money strip
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const needs = all.filter((d) => NEEDS.includes(d.status));
  const open = all.filter((d) => OPEN.includes(d.status));
  const won = all.filter((d) => d.status === "won");
  const wonMonth = won.filter((d) => new Date(d.updated_at) >= monthStart);
  const lost = all.filter((d) => ["rejected", "withdrawn", "expired"].includes(d.status)).length;
  const marginOf = (rows: Deal[]) => rows.reduce((s, d) => s + Math.max(0, d.margin ?? 0) * d.area_sqft, 0);
  const oldest = needs.reduce((m, d) => (d.updated_at < m ? d.updated_at : m), needs[0]?.updated_at ?? "");
  const count = (t: (typeof TABS)[number]) => (t.statuses.length ? all.filter((d) => (t.statuses as readonly string[]).includes(d.status)).length : all.length);

  let rows = tab.statuses.length ? all.filter((d) => (tab.statuses as readonly string[]).includes(d.status)) : all;
  if (q) rows = rows.filter((d) => [d.tenant_company, d.tenant_name, d.tenant?.phone, d.listing?.name, d.listing?.micro_market, d.listing?.owner?.company_name, d.listing?.owner?.phone]
    .some((v) => v?.toLowerCase().includes(q)));
  if (tab.key === "needs") rows = [...rows].sort((a, b) => +new Date(a.updated_at) - +new Date(b.updated_at)); // oldest waiting first

  const tiles = [
    { icon: CircleAlert, label: "Needs you", value: String(needs.length), sub: needs.length ? `oldest waiting ${age(oldest)}` : "all clear 🎉", hot: needs.length > 0 },
    { icon: IndianRupee, label: "Open pipeline", value: `${lakh(open.reduce((s, d) => s + d.value, 0))}/mo`, sub: `${open.length} live deals · rent in play` },
    { icon: Trophy, label: "Won this month", value: String(wonMonth.length), sub: `${lakh(wonMonth.reduce((s, d) => s + d.value, 0))}/mo · win rate ${won.length + lost ? Math.round((won.length / (won.length + lost)) * 100) : 0}%` },
    { icon: Wallet, label: "Your margin", value: `${lakh(marginOf(won))}/mo`, sub: `on won deals · ${lakh(marginOf(open))}/mo more in open deals` },
  ];

  return (
    <>
      <PageHead title="Deals" sub="Every quote passes through you. Owners never see the company; companies only see prices you approve." />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tiles.map(({ icon: Icon, label, value, sub, hot }) => (
          <div key={label} className={`rounded-[1.5rem] bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ${hot ? "ring-coral/40" : "ring-line"}`}>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted"><Icon className={`size-4 ${hot ? "text-coral" : "text-brand"}`} />{label}</p>
            <p className={`display mt-2 text-2xl font-black sm:text-3xl ${hot ? "text-coral" : ""}`}>{value}</p>
            <p className="mt-0.5 text-xs text-muted">{sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Deal stages" className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
          {TABS.map((t) => {
            const n = count(t);
            return (
              <Link key={t.key} href={`?tab=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`} data-active={t.key === tab.key} className="chip shrink-0 !py-1.5">
                {t.label}<span className={`rounded-full px-1.5 text-[11px] ${t.key === tab.key ? "bg-white/20" : t.key === "needs" && n ? "bg-coral text-white" : "bg-surface"}`}>{n}</span>
              </Link>
            );
          })}
        </nav>
        <form className="relative lg:w-80">
          <input type="hidden" name="tab" value={tab.key} />
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={q} placeholder="Search company, warehouse, phone" className="field !rounded-full !py-2.5 !pl-10 text-sm" />
        </form>
      </div>

      <div className="mt-4">
        {!rows.length ? <Empty text={q ? "No deals match your search." : tab.key === "needs" ? "Nothing needs you right now. 🎉" : "No deals here yet."} /> : (
          <ul className="space-y-4">{rows.map((d) => <DealCard key={d.id} d={d} />)}</ul>
        )}
      </div>
    </>
  );
}

/** What the admin should do next, in one line, and how urgent it is. */
function nextStep(d: Deal): { text: string; tone: "you" | "wait" | "done" } {
  const r = (n: number | null | undefined) => (n == null ? "—" : `₹${n}/sq ft`);
  switch (d.status) {
    case "pending_review": return d.listing?.owner
      ? { tone: "you", text: "New request. Forward it to the owner for their best price (they won't see who the company is)." }
      : { tone: "you", text: "New request on a platform listing (no owner account). Send the company a quote directly." };
    case "owner_quoted": return { tone: "you", text: `Owner quoted ${r(d.ask)}. Add your margin and send it to the company.` };
    case "counter_review": return { tone: "you", text: `Company asks ${r(d.counter_rent_psf)} (you offered ${r(d.rent_psf)}). Pass it to the owner, or send a revised quote.` };
    case "accepted": return { tone: "you", text: `Company accepted ${r(d.rent_psf)} 🎉 Call both sides to finalise the agreement, then mark it Won.` };
    case "requested": return { tone: "wait", text: `Waiting for the owner's quote${hoursSince(d.updated_at) > 24 ? " for over a day. Give them a call." : "."}` };
    case "negotiating": return { tone: "wait", text: `Owner is considering a counter of ${r(d.o?.counter_rent_psf)}.` };
    case "quoted": return { tone: "wait", text: `Company is reviewing your quote of ${r(d.rent_psf)}${hoursSince(d.updated_at) > 48 ? ". Follow up with a call." : "."}` };
    case "won": return { tone: "done", text: `Won at ${r(d.rent_psf)} · ${inr(d.value)}/month${d.margin ? ` · your margin ${inr(d.margin * d.area_sqft)}/month` : ""}.` };
    default: return { tone: "done", text: `Closed as ${d.status}.` };
  }
}

const TONE = {
  you: "bg-coral/10 text-coral ring-coral/20",
  wait: "bg-ice/60 text-royal ring-sky/20",
  done: "bg-surface text-muted ring-line",
};

function DealCard({ d }: { d: Deal }) {
  const owner = d.listing?.owner;
  const step = nextStep(d);
  const isOpen = OPEN.includes(d.status);
  const h = hoursSince(d.updated_at);
  const urgency = step.tone !== "you" ? "bg-surface text-muted" : h > 72 ? "bg-coral text-white" : h > 24 ? "bg-amber/20 text-amber" : "bg-mint/10 text-mint";
  // quote prefill: the owner's terms when reviewing their quote, else what the company has, else the listed rent
  const base: Terms = d.o?.rent_psf && d.status === "owner_quoted" ? d.o : d.rent_psf ? d : { ...d, rent_psf: d.listing?.rent_psf ?? null };
  // forwarding a counter: suggest a number that keeps the current margin
  const keep = d.counter_rent_psf != null && d.margin && d.margin > 0 ? +(d.counter_rent_psf - d.margin).toFixed(2) : d.counter_rent_psf;

  return (
    <li className="overflow-hidden rounded-[1.5rem] bg-white shadow-[var(--shadow-soft)] ring-1 ring-line">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3 p-5 pb-3">
        <div className="min-w-0">
          <Link href={`/warehouse/${d.listing?.id}`} target="_blank" className="text-lg font-extrabold hover:text-brand">{d.listing?.name ?? "—"}</Link>
          <p className="text-sm text-muted">{d.listing?.micro_market ?? ""} · {sqft(d.area_sqft)} · move-in {when(d.move_in)} · {d.tenure_months ?? "—"} months</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${urgency}`} title={`Last update ${when(d.updated_at, true)}`}><Clock className="size-3" />{age(d.updated_at)}</span>
          <Badge s={d.status} />
        </div>
      </div>

      {/* next step */}
      <p className={`mx-5 flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ring-1 ${TONE[step.tone]}`}>
        <ArrowRight className="mt-0.5 size-4 shrink-0" />{step.text}
      </p>

      {/* money */}
      <div className="mx-5 mt-3 flex flex-wrap items-center gap-x-1 gap-y-2 text-xs">
        <Price label="Listed" v={d.listing?.rent_psf} />
        <Price label="Owner asks" v={d.ask} />
        <Price label="Company sees" v={d.rent_psf} strong />
        {d.counter_rent_psf != null && ["counter_review", "negotiating"].includes(d.status) && <Price label="Company counter" v={d.counter_rent_psf} hot />}
        <span className="ml-auto flex flex-wrap gap-2">
          <span className="rounded-full bg-surface px-3 py-1.5 font-bold">Deal {inr(d.value)}/mo</span>
          {d.margin != null && <span className={`rounded-full px-3 py-1.5 font-bold ${d.margin > 0 ? "bg-mint/10 text-mint" : "bg-coral/10 text-coral"}`}>
            Margin ₹{+d.margin.toFixed(2)}/sq ft · {inr(d.margin * d.area_sqft)}/mo</span>}
        </span>
      </div>

      {/* people */}
      <div className="mt-3 grid gap-3 px-5 md:grid-cols-2">
        <Party title="Company · only you see this" icon={UserRound} name={d.tenant_company ?? "—"} sub={d.tenant_name} phone={d.tenant?.phone} note={d.tenant_note && `“${d.tenant_note}”`} />
        <Party title="Owner" icon={Building2} name={owner?.company_name ?? "Platform listing (no owner account)"} sub={owner?.full_name} phone={owner?.phone}
          note={d.o?.owner_note ? `Owner note: “${d.o.owner_note}”` : d.o?.requirements ? `You told the owner: “${d.o.requirements}”` : null} />
      </div>

      {/* actions */}
      {isOpen && (
        <div className="mt-4 space-y-3 border-t border-line bg-surface/60 p-5">
          {d.status === "pending_review" && owner && (
            <ActionForm action={forwardQuote.bind(null, d.id)} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex-1"><span className="label">Note for the owner (no company name or contact)</span>
                <input name="requirements" defaultValue={d.o?.requirements ?? ""} maxLength={1000} placeholder="e.g. FMCG storage, 2 docks, 24×7 access" className="field !bg-white" /></label>
              <button className="btn btn-primary shrink-0">Ask owner for a quote</button>
            </ActionForm>
          )}
          {d.status === "counter_review" && d.o && (
            <ActionForm action={forwardCounter.bind(null, d.id)} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label><span className="label">Counter to send the owner ₹/sq ft</span>
                <input name="counter_rent_psf" type="number" step="any" min={0} required defaultValue={keep ?? ""} className="field !bg-white sm:!w-44" /></label>
              <p className="flex-1 pb-2 text-xs text-muted">{keep !== d.counter_rent_psf ? `Suggested ₹${keep} keeps your ₹${d.margin}/sq ft margin (company asked ₹${d.counter_rent_psf}).` : "The owner sees only this number."}</p>
              <button className="btn btn-primary shrink-0">Send counter to owner</button>
            </ActionForm>
          )}
          {d.status !== "accepted" && (
            <details open={["owner_quoted", "counter_review"].includes(d.status) || (d.status === "pending_review" && !owner)} className="rounded-2xl bg-white p-4 ring-1 ring-line">
              <summary className="cursor-pointer text-sm font-extrabold">
                {d.status === "owner_quoted" ? "Approve and send to the company" : d.status === "counter_review" ? "…or send the company a revised quote" : d.status === "quoted" ? "Revise the company's quote" : "Quote the company directly"}
              </summary>
              <div className="mt-3">
                <QuoteForm action={sendQuote.bind(null, d.id)} base={base} ownerAsk={d.ask} area={d.area_sqft}
                  note={d.status === "owner_quoted" ? "" : d.owner_note ?? ""} cta={d.status === "owner_quoted" ? "Approve and send to company" : "Send to company"} />
              </div>
            </details>
          )}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="mr-1 text-xs font-bold text-muted">Close deal:</span>
            <ActionButton action={closeDeal.bind(null, d.id, "won")} confirm="Mark this deal as WON? Both sides will be told." className="bg-lime text-ink hover:brightness-95">Won 🎉</ActionButton>
            <ActionButton action={closeDeal.bind(null, d.id, "rejected")} confirm="Close this deal as lost?" className="bg-white text-coral ring-1 ring-line hover:ring-coral">Lost</ActionButton>
            <ActionButton action={closeDeal.bind(null, d.id, "expired")} confirm="Mark this quote as expired?" className="bg-white text-muted ring-1 ring-line hover:text-ink">Expired</ActionButton>
          </div>
        </div>
      )}
      {!isOpen && <div className="h-5" />}
    </li>
  );
}

function Price({ label, v, strong, hot }: { label: string; v: number | null | undefined; strong?: boolean; hot?: boolean }) {
  if (v == null) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 ${hot ? "bg-coral/10 text-coral" : strong ? "bg-navy text-white" : "bg-ice/50 text-navy"}`}>
      <span className="opacity-75">{label}</span><b>₹{v}</b>
    </span>
  );
}

function Party({ title, icon: Icon, name, sub, phone, note }: { title: string; icon: typeof Phone; name: string; sub?: string | null; phone?: string | null; note?: string | null }) {
  const digits = phone?.replace(/\D/g, "") ?? "";
  const wa = digits.length === 10 ? `91${digits}` : digits;
  return (
    <div className="rounded-2xl bg-surface p-3 text-sm">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{title}</p>
      <p className="mt-1 flex items-center gap-1.5 font-bold"><Icon className="size-4 shrink-0 text-brand" /><span className="truncate">{name}</span>{sub && <span className="truncate font-medium text-muted">· {sub}</span>}</p>
      {phone && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand ring-1 ring-line hover:ring-brand"><Phone className="size-3.5" />{phone}</a>
          {wa.length >= 11 && <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-mint/10 px-3 py-1.5 text-xs font-bold text-mint hover:bg-mint/20"><MessageCircle className="size-3.5" />WhatsApp</a>}
        </div>
      )}
      {note && <p className="mt-2 text-xs text-muted">{note}</p>}
    </div>
  );
}
