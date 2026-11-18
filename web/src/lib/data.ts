import {
  Boxes, Snowflake, Thermometer, ShoppingCart, Truck, ArrowLeftRight, FlaskConical,
  Pill, Wheat, Landmark, Cog, Fence, type LucideIcon,
} from "lucide-react";

export const STORAGE_TYPES: { name: string; short: string; icon: LucideIcon; tint: string }[] = [
  { name: "General / Dry storage", short: "Dry storage", icon: Boxes, tint: "bg-brand/10 text-brand" },
  { name: "Cold storage", short: "Cold", icon: Snowflake, tint: "bg-sky/15 text-sky" },
  { name: "Climate-controlled", short: "Climate", icon: Thermometer, tint: "bg-coral/10 text-coral" },
  { name: "E-commerce fulfillment", short: "E-commerce", icon: ShoppingCart, tint: "bg-violet/10 text-violet" },
  { name: "3PL", short: "3PL", icon: Truck, tint: "bg-amber/15 text-amber" },
  { name: "Cross-docking", short: "Cross-dock", icon: ArrowLeftRight, tint: "bg-mint/10 text-mint" },
  { name: "Hazmat", short: "Hazmat", icon: FlaskConical, tint: "bg-danger/10 text-danger" },
  { name: "Pharma-grade", short: "Pharma", icon: Pill, tint: "bg-violet/10 text-violet" },
  { name: "Food grade", short: "Food", icon: Wheat, tint: "bg-amber/15 text-amber" },
  { name: "Bonded / SEZ", short: "Bonded", icon: Landmark, tint: "bg-royal/10 text-royal" },
  { name: "Auto parts", short: "Auto parts", icon: Cog, tint: "bg-coral/10 text-coral" },
  { name: "Open yard", short: "Open yard", icon: Fence, tint: "bg-mint/10 text-mint" },
];

export const MICRO_MARKETS = [
  "Chakan MIDC Phase I", "Chakan MIDC Phase II", "Chakan MIDC Phase III", "Chakan MIDC Phase IV",
  "Mahalunge", "Kuruli", "Talegaon MIDC", "Bhosari MIDC", "Ranjangaon MIDC", "Sanaswadi",
  "Hinjewadi", "Pimpri-Chinchwad", "Wagholi", "Lonikand",
];

export const LANDMARKS = ["Volkswagen", "Bajaj Auto", "Mahindra", "Mercedes-Benz", "Tata Motors", "IndoSpace"];

export const AMENITIES = [
  "CCTV", "24x7 security", "Weighbridge", "Canteen", "Driver rest room", "Racking",
  "Mezzanine", "Boundary wall", "Temperature control", "Pest control", "24x7 access", "Backup power",
];

export type Listing = {
  id: string;
  owner_id: string | null;
  status: string;
  rejection_reason: string | null;
  verified: boolean;
  name: string;
  city: string;
  micro_market: string | null;
  address: string | null;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
  primary_type: string | null;
  storage_types: string[];
  building_type: string | null;
  area_total: number | null;
  area_available: number | null;
  area_min: number | null;
  description: string | null;
  dist_highway_km: number | null;
  dist_airport_km: number | null;
  dist_railway_km: number | null;
  road_width_ft: number | null;
  inside_midc: boolean;
  container_40ft: boolean;
  landmarks: string[];
  grade: string | null;
  flooring: string | null;
  clear_height_m: number | null;
  eave_height_m: number | null;
  floor_load_mt: number | null;
  docks: number | null;
  dock_levelers: boolean;
  truck_parking: number | null;
  office_sqft: number | null;
  amenities: string[];
  power_kva: number | null;
  power_backup: string | null;
  fire_safety: string | null;
  fire_noc: boolean;
  fire_noc_expiry: string | null;
  rent_psf: number | null;
  cam_psf: number | null;
  deposit_months: number | null;
  escalation_pct: number | null;
  lock_in_months: number | null;
  available_from: string | null;
  flex_enabled: boolean;
  flex_rate_pallet: number | null;
  photos: string[];
  created_at: string;
};

export const CARD_FIELDS =
  "id,name,micro_market,city,primary_type,storage_types,area_available,rent_psf,clear_height_m,docks,verified,photos,lat,lng,flex_enabled,inside_midc,status";

export type CardListing = Pick<Listing,
  "id" | "name" | "micro_market" | "city" | "primary_type" | "storage_types" | "area_available" | "rent_psf" |
  "clear_height_m" | "docks" | "verified" | "photos" | "lat" | "lng" | "flex_enabled" | "inside_midc" | "status">;

export const FALLBACK_PHOTO = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d";

export const img = (url: string | undefined, w = 900) =>
  !url ? `${FALLBACK_PHOTO}?w=${w}&q=70&auto=format&fit=crop`
  : url.includes("images.unsplash.com") ? `${url}?w=${w}&q=70&auto=format&fit=crop` : url;

export const sqft = (n: number | null | undefined) => (n == null ? "—" : `${n.toLocaleString("en-IN")} sq ft`);

/** ₹ in Indian short form: 1290000 → ₹12.9L, 25000000 → ₹2.5Cr */
export const inr = (n: number | null | undefined) => {
  if (n == null) return "—";
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(n >= 1e8 ? 0 : 1)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};

export const date = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/** Monthly outgo and total cost of occupancy over lock-in, the number tenants actually compare. */
export function costBreakdown(area: number, rent: number, cam = 0, depositMonths = 0, lockIn = 0, escalation = 0) {
  const base = area * (rent + cam);
  const gst = base * 0.18;
  const monthly = base + gst;
  const deposit = area * rent * depositMonths;
  let total = 0;
  for (let m = 0; m < lockIn; m++) total += monthly * (1 + escalation / 100) ** Math.floor(m / 12);
  return { base, gst, monthly, deposit, total };
}
