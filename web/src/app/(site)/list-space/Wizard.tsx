"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowLeft, ArrowRight, Building2, Check, ClipboardCheck, ImagePlus, IndianRupee, Loader2, MapPin, Ruler,
  Save, ShieldCheck, Trash2, UploadCloud,
} from "lucide-react";
import { saveListing } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import { AMENITIES, LANDMARKS, MICRO_MARKETS, STORAGE_TYPES, img } from "@/lib/data";

const PinPicker = dynamic(() => import("./PinPicker"), { ssr: false, loading: () => <div className="h-full animate-pulse bg-ice/40" /> });

type F = Record<string, unknown> & { id?: string; name: string; storage_types: string[]; landmarks: string[]; amenities: string[]; photos: string[] };

const STEPS = [
  { key: "basic", label: "Basics", icon: Building2 },
  { key: "location", label: "Location", icon: MapPin },
  { key: "infra", label: "Infrastructure", icon: Ruler },
  { key: "compliance", label: "Compliance", icon: ShieldCheck },
  { key: "pricing", label: "Pricing", icon: IndianRupee },
  { key: "photos", label: "Photos", icon: ImagePlus },
  { key: "review", label: "Review", icon: ClipboardCheck },
];

const EMPTY: F = {
  name: "", city: "Pune", storage_types: [], landmarks: [], amenities: [], photos: [],
  inside_midc: false, container_40ft: false, dock_levelers: false, fire_noc: false, flex_enabled: false, // never pre-tick claims
};

function validate(step: number, f: F): Record<string, string> {
  const e: Record<string, string> = {};
  const need = (k: string, msg: string) => { if (f[k] === undefined || f[k] === null || f[k] === "") e[k] = msg; };
  const positive = (k: string, msg: string) => { if (!(Number(f[k]) > 0)) e[k] = msg; };
  if (step === 0) {
    need("name", "Give your warehouse a name"); need("micro_market", "Pick the micro-market"); need("address", "Enter the address");
    need("primary_type", "Pick the main storage type"); positive("area_available", "Enter available area");
    if (Number(f.area_min) > Number(f.area_available)) e.area_min = "Can't be more than available area";
  }
  if (step === 1 && !(f.lat && f.lng)) e.lat = "Click the map to place your warehouse";
  if (step === 2) { positive("clear_height_m", "Enter clear height"); need("docks", "Enter number of docks (0 if none)"); need("flooring", "Pick flooring"); need("grade", "Pick grade"); }
  if (step === 3) { positive("power_kva", "Enter sanctioned load"); need("fire_safety", "Pick fire safety system"); if (f.fire_noc) need("fire_noc_expiry", "Enter NOC expiry date"); }
  if (step === 4) { positive("rent_psf", "Enter asking rent"); need("deposit_months", "Pick deposit"); need("lock_in_months", "Pick lock-in"); need("available_from", "Pick a date"); if (f.flex_enabled) positive("flex_rate_pallet", "Enter pallet rate"); }
  if (step === 5 && f.photos.length < 3) e.photos = "Upload at least 3 photos (exterior, docks, interior)";
  return e;
}

export function Wizard({ userId, initial }: { userId: string; initial?: F }) {
  const router = useRouter();
  const [f, setF] = useState<F>(initial ?? EMPTY);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);

  const set = (k: string, v: unknown) => { setF((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };
  const toggleIn = (k: "storage_types" | "landmarks" | "amenities", v: string) =>
    set(k, f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v]);

  const save = (submit: boolean) => start(async () => {
    const r = await saveListing(f, submit);
    if (!r.ok) return setMsg({ ok: false, text: r.error });
    setF((p) => ({ ...p, id: r.id }));
    if (submit) router.push("/dashboard?tab=listings&submitted=1");
    else setMsg({ ok: true, text: "Draft saved" });
  });

  const next = () => {
    const e = validate(step, f);
    setErrors(e);
    if (Object.keys(e).length) return;
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const supabase = createClient();
    const urls: string[] = [];
    for (const file of Array.from(files).slice(0, 12)) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
        setMsg({ ok: false, text: `${file.name}: only JPG/PNG/WEBP up to 5 MB` });
        continue;
      }
      const path = `${userId}/${crypto.randomUUID()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("listing-photos").upload(path, file);
      if (error) { setMsg({ ok: false, text: error.message }); continue; }
      urls.push(supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl);
    }
    set("photos", [...f.photos, ...urls]);
    setUploading(false);
  }

  const completeness = Math.round((STEPS.slice(0, 6).filter((_, i) => !Object.keys(validate(i, f)).length).length / 6) * 100);

  return (
    <div>
      {/* Stepper */}
      <ol className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-7 sm:px-0">
        {STEPS.map(({ key, label, icon: Icon }, i) => {
          const state = i < step ? "done" : i === step ? "current" : "todo";
          return (
            <li key={key} className="shrink-0">
              <button type="button" disabled={i > step} onClick={() => setStep(i)} aria-current={state === "current" ? "step" : undefined}
                className={`flex w-full items-center gap-2 rounded-2xl border p-2.5 pr-4 text-left transition sm:flex-col sm:items-start sm:pr-2.5 ${
                  state === "current" ? "border-brand bg-white shadow-[var(--shadow-soft)]" : state === "done" ? "border-transparent bg-white/60" : "border-transparent opacity-60"}`}>
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${state === "todo" ? "bg-line text-muted" : "bg-gradient-to-br from-sky to-royal text-white"}`}>
                  {state === "done" ? <Check className="size-4" /> : <Icon className="size-4" />}
                </span>
                <span className="text-xs font-bold"><span className="block font-semibold text-muted">Step {i + 1}</span>{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-gradient-to-r from-sky to-royal transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>

      <div className="card mt-6 p-5 sm:p-8">
        <h2 className="flex items-center gap-3 text-2xl font-extrabold">
          {(() => { const I = STEPS[step].icon; return <span className="grid size-11 place-items-center rounded-2xl bg-ice/60 text-brand"><I className="size-5" /></span>; })()}
          {STEPS[step].label}
        </h2>
        <hr className="my-6 border-line" />

        {step === 0 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <T f={f} set={set} e={errors} k="name" label="Warehouse name" ph="e.g. Chakan Phase II Grade-A Park" full />
            <S f={f} set={set} e={errors} k="micro_market" label="Micro-market" opts={MICRO_MARKETS} full />
            <T f={f} set={set} e={errors} k="address" label="Address / plot no." ph="Plot A-14, MIDC Phase II, Chakan" full />
            <T f={f} set={set} e={errors} k="pincode" label="PIN code" ph="410501" />
            <S f={f} set={set} e={errors} k="building_type" label="Building type" opts={["PEB", "RCC", "Shed", "Open land + shed", "Open land"]} />
            <S f={f} set={set} e={errors} k="primary_type" label="Primary storage type" opts={STORAGE_TYPES.map((t) => t.name)} full
              onPick={(v) => !f.storage_types.includes(v) && set("storage_types", [...f.storage_types, v])} />
            <div className="sm:col-span-2 grid gap-5 sm:grid-cols-3">
              <N f={f} set={set} e={errors} k="area_total" label="Total built-up (sq ft)" ph="120000" />
              <N f={f} set={set} e={errors} k="area_available" label="Available area (sq ft)" ph="52000" />
              <N f={f} set={set} e={errors} k="area_min" label="Min. divisible area (sq ft)" ph="15000" />
            </div>
            <Chips label="Also suitable for" opts={STORAGE_TYPES.map((t) => t.name)} value={f.storage_types} onToggle={(v) => toggleIn("storage_types", v)} />
            <label className="sm:col-span-2"><span className="label">Description</span>
              <textarea rows={4} value={(f.description as string) ?? ""} onChange={(e) => set("description", e.target.value)} className="field resize-y"
                placeholder="Access, docks, clear height, power backup, compliance and ideal use cases." /></label>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <span className="label">Pin your warehouse on the map</span>
              <div className={`h-80 overflow-hidden rounded-3xl border-2 ${errors.lat ? "border-danger" : "border-line"}`}>
                <PinPicker lat={(f.lat as number) ?? null} lng={(f.lng as number) ?? null} onPick={(a, b) => { set("lat", a); set("lng", b); }} />
              </div>
              <p className={`mt-2 text-sm ${errors.lat ? "font-semibold text-danger" : "text-muted"}`}>
                {errors.lat || (f.lat ? `Pinned at ${f.lat}, ${f.lng}` : "Zoom in and click the exact entrance gate.")}
              </p>
            </div>
            <N f={f} set={set} e={errors} k="dist_highway_km" label="Distance to highway (km)" ph="2.5" step={0.1} />
            <N f={f} set={set} e={errors} k="dist_airport_km" label="Distance to airport (km)" ph="32" step={0.1} />
            <N f={f} set={set} e={errors} k="dist_railway_km" label="Distance to railway station (km)" ph="18" step={0.1} />
            <N f={f} set={set} e={errors} k="road_width_ft" label="Approach road width (ft)" ph="60" />
            <B f={f} set={set} k="inside_midc" label="Inside MIDC zone" />
            <B f={f} set={set} k="container_40ft" label="40-ft container truck can reach the dock" />
            <Chips label="Nearby OEM plants / landmarks" opts={LANDMARKS} value={f.landmarks} onToggle={(v) => toggleIn("landmarks", v)} />
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <S f={f} set={set} e={errors} k="grade" label="Warehouse grade" opts={["A", "B", "C"]} />
            <S f={f} set={set} e={errors} k="flooring" label="Flooring" opts={["FM2 / Laser screed", "VDF trimix", "Trimix", "Epoxy", "Concrete", "Concrete paver"]} full />
            <N f={f} set={set} e={errors} k="clear_height_m" label="Clear height at centre (m)" ph="12" step={0.1} />
            <N f={f} set={set} e={errors} k="eave_height_m" label="Height at eaves (m)" ph="9" step={0.1} />
            <N f={f} set={set} e={errors} k="floor_load_mt" label="Floor load (MT/sqm)" ph="5" step={0.5} />
            <N f={f} set={set} e={errors} k="docks" label="Number of docks" ph="8" />
            <N f={f} set={set} e={errors} k="truck_parking" label="Truck parking bays" ph="20" />
            <N f={f} set={set} e={errors} k="office_sqft" label="Office area (sq ft)" ph="2500" />
            <B f={f} set={set} k="dock_levelers" label="Docks have hydraulic levelers" />
            <Chips label="Amenities" opts={AMENITIES} value={f.amenities} onToggle={(v) => toggleIn("amenities", v)} />
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <N f={f} set={set} e={errors} k="power_kva" label="Sanctioned power load (KVA)" ph="150" />
            <S f={f} set={set} e={errors} k="power_backup" label="Power backup" opts={["None", "DG 50%", "DG 70%", "DG 100%"]} />
            <S f={f} set={set} e={errors} k="fire_safety" label="Fire safety system" opts={["Extinguishers", "Extinguishers + hydrants", "Hydrants + sprinklers", "ESFR sprinklers"]} full />
            <B f={f} set={set} k="fire_noc" label="Valid Fire NOC available" />
            {f.fire_noc ? <D f={f} set={set} e={errors} k="fire_noc_expiry" label="Fire NOC valid until" /> : <div />}
            <p className="flex gap-2 rounded-2xl bg-ice/40 p-4 text-sm text-royal sm:col-span-2">
              <ShieldCheck className="size-5 shrink-0" /> Our field team checks the Fire NOC, Occupancy Certificate, title and MIDC allotment during the site visit before your listing gets the Verified badge.
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <N f={f} set={set} e={errors} k="rent_psf" label="Asking rent (₹/sq ft/month)" ph="24" step={0.5} />
            <N f={f} set={set} e={errors} k="cam_psf" label="CAM / maintenance (₹/sq ft/month)" ph="3" step={0.5} />
            <S f={f} set={set} e={errors} k="deposit_months" label="Security deposit" opts={["1", "2", "3", "6", "10", "12"]} fmt={(v) => `${v} months`} />
            <S f={f} set={set} e={errors} k="lock_in_months" label="Minimum lock-in" opts={["0", "6", "12", "24", "36", "60"]} fmt={(v) => (v === "0" ? "No lock-in" : `${v} months`)} />
            <N f={f} set={set} e={errors} k="escalation_pct" label="Annual escalation (%)" ph="5" step={0.5} />
            <D f={f} set={set} e={errors} k="available_from" label="Available from" />
            <B f={f} set={set} k="flex_enabled" label="Offer flexible short-term / per-pallet storage" />
            {f.flex_enabled ? <N f={f} set={set} e={errors} k="flex_rate_pallet" label="Flex rate (₹/pallet/month)" ph="600" /> : <div />}
          </div>
        )}

        {step === 5 && (
          <div>
            <label className={`flex cursor-pointer flex-col items-center rounded-3xl border-2 border-dashed p-10 text-center transition hover:border-sky hover:bg-ice/20 ${errors.photos ? "border-danger" : "border-line"}`}>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => upload(e.target.files)} />
              <span className="grid size-14 place-items-center rounded-full bg-ice/60 text-brand">{uploading ? <Loader2 className="size-6 animate-spin" /> : <UploadCloud className="size-6" />}</span>
              <p className="mt-3 font-extrabold">{uploading ? "Uploading…" : "Upload warehouse photos"}</p>
              <p className="mt-1 text-sm text-muted">Exterior, approach road, docks, interior, flooring, office. JPG / PNG / WEBP, up to 5 MB each.</p>
              <span className="btn btn-ghost mt-4">Browse files</span>
            </label>
            {errors.photos && <p className="mt-2 text-sm font-semibold text-danger">{errors.photos}</p>}
            {f.photos.length > 0 && (
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {f.photos.map((p, i) => (
                  <li key={p} className="group relative aspect-[4/3] overflow-hidden rounded-2xl">
                    <Image src={img(p, 400)} alt={`Photo ${i + 1}`} fill sizes="25vw" className="object-cover" />
                    {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-navy px-2 py-0.5 text-[11px] font-bold text-white">Cover</span>}
                    <button type="button" onClick={() => set("photos", f.photos.filter((x) => x !== p))} aria-label={`Remove photo ${i + 1}`}
                      className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/90 text-danger"><Trash2 className="size-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 6 && (
          <div>
            <div className="flex items-center gap-4 rounded-3xl bg-surface p-5">
              <div className="relative grid size-16 place-items-center rounded-full" style={{ background: `conic-gradient(var(--color-brand) ${completeness * 3.6}deg, var(--color-line) 0)` }}>
                <span className="grid size-12 place-items-center rounded-full bg-white text-sm font-extrabold">{completeness}%</span>
              </div>
              <div><p className="font-extrabold">Listing quality score</p><p className="text-sm text-muted">Complete listings get up to 3× more quote requests.</p></div>
            </div>
            <dl className="mt-5 grid gap-x-8 sm:grid-cols-2">
              {[
                ["Name", f.name], ["Micro-market", f.micro_market], ["Primary type", f.primary_type], ["Available area", f.area_available && `${Number(f.area_available).toLocaleString("en-IN")} sq ft`],
                ["Clear height", f.clear_height_m && `${f.clear_height_m} m`], ["Docks", f.docks], ["Power", f.power_kva && `${f.power_kva} KVA`],
                ["Fire NOC", f.fire_noc ? `Yes, till ${f.fire_noc_expiry}` : "No"], ["Rent", f.rent_psf && `₹${f.rent_psf}/sq ft`], ["Deposit", f.deposit_months && `${f.deposit_months} months`],
                ["Available from", f.available_from], ["Photos", f.photos.length],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between border-b border-line py-3 text-sm"><dt className="text-muted">{k as string}</dt><dd className="font-bold">{(v as string) || "—"}</dd></div>
              ))}
            </dl>
            <p className="mt-5 text-sm text-muted">After you submit, our team reviews the listing and schedules a site visit. It goes live once approved.</p>
          </div>
        )}

        {msg && <p role="status" className={`mt-6 rounded-2xl px-4 py-3 text-sm font-semibold ${msg.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>{msg.text}</p>}

        <hr className="my-6 border-line" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          {step > 0 ? <button type="button" onClick={() => setStep(step - 1)} className="btn btn-ghost"><ArrowLeft className="size-4" /> Back</button> : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={() => save(false)} disabled={pending || !f.name} className="btn btn-ghost"><Save className="size-4" /> <span className="hidden sm:inline">Save draft</span></button>
            {step < STEPS.length - 1
              ? <button type="button" onClick={next} className="btn btn-dark">Next step <ArrowRight className="size-4" /></button>
              : <button type="button" onClick={() => save(true)} disabled={pending} className="btn btn-primary">{pending ? "Submitting…" : "Submit for verification"}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- field helpers ---------- */
type P = { f: F; set: (k: string, v: unknown) => void; e?: Record<string, string>; k: string; label: string; ph?: string; full?: boolean };

function Err({ m }: { m?: string }) { return m ? <span className="mt-1 block text-xs font-semibold text-danger">{m}</span> : null; }

function T({ f, set, e, k, label, ph, full }: P) {
  return <label className={full ? "sm:col-span-2" : ""}><span className="label">{label}</span>
    <input value={(f[k] as string) ?? ""} onChange={(x) => set(k, x.target.value)} placeholder={ph} aria-invalid={!!e?.[k]} className="field" /><Err m={e?.[k]} /></label>;
}
/** Number field; a trailing "(unit)" in the label is shown inside the box instead. */
function N({ f, set, e, k, label, ph, step = 1 }: P & { step?: number }) {
  const unit = label.match(/\(([^)]+)\)$/)?.[1];
  return <label><span className="label">{unit ? label.slice(0, label.lastIndexOf("(")).trim() : label}</span>
    <span className="relative block">
      <input type="number" inputMode="decimal" min={0} step={step} value={(f[k] as number) ?? ""} onChange={(x) => set(k, x.target.value === "" ? null : Number(x.target.value))}
        placeholder={ph} aria-invalid={!!e?.[k]} className={`field ${unit ? "pr-28" : ""}`} />
      {unit && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-ice/60 px-2 py-1 text-xs font-bold text-royal">{unit}</span>}
    </span><Err m={e?.[k]} /></label>;
}
function D({ f, set, e, k, label }: P) {
  return <label><span className="label">{label}</span>
    <input type="date" value={(f[k] as string) ?? ""} onChange={(x) => set(k, x.target.value)} aria-invalid={!!e?.[k]} data-filled={!!f[k]} className="field" /><Err m={e?.[k]} /></label>;
}
/** Single choice as tap-to-pick buttons (no browser dropdown). Tapping the picked one again clears it. */
function S({ f, set, e, k, label, opts, fmt, onPick, full }: P & { opts: string[]; fmt?: (v: string) => string; onPick?: (v: string) => void }) {
  const cur = f[k] == null ? "" : String(f[k]);
  const pick = (v: string) => { const next = cur === v ? "" : v; set(k, next && /^\d+$/.test(next) && fmt ? Number(next) : next || null); if (next) onPick?.(next); };
  return <fieldset className={full ? "sm:col-span-2" : ""}><legend className="label">{label}</legend>
    <div className={`flex flex-wrap gap-2 rounded-2xl ${e?.[k] ? "ring-2 ring-danger/40 ring-offset-2" : ""}`}>
      {opts.map((o) => <button key={o} type="button" className="pick" aria-pressed={cur === o} onClick={() => pick(o)}>
        {cur === o && <Check className="size-3.5" />}{fmt ? fmt(o) : o}</button>)}
    </div><Err m={e?.[k]} /></fieldset>;
}
function B({ f, set, k, label }: P) {
  const on = !!f[k];
  return <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border-[1.5px] p-4 transition ${on ? "border-brand bg-ice/40" : "border-line bg-surface hover:border-sky"}`}>
    <span className="text-sm font-semibold">{label}</span>
    <input type="checkbox" checked={on} onChange={(x) => set(k, x.target.checked)} className="peer sr-only" />
    <span aria-hidden className={`relative h-6 w-11 shrink-0 rounded-full transition peer-focus-visible:ring-4 peer-focus-visible:ring-sky/30 ${on ? "bg-brand" : "bg-line"}`}>
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </span></label>;
}
function Chips({ label, opts, value, onToggle }: { label: string; opts: string[]; value: string[]; onToggle: (v: string) => void }) {
  return <fieldset className="sm:col-span-2"><legend className="label">{label}</legend>
    <div className="flex flex-wrap gap-2">{opts.map((o) => (
      <button key={o} type="button" className="chip" data-active={value.includes(o)} aria-pressed={value.includes(o)} onClick={() => onToggle(o)}>
        {value.includes(o) && <Check className="size-3.5" />}{o}</button>))}</div></fieldset>;
}
