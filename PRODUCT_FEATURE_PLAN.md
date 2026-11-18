# Chakan MIDC Force: Product Feature & Usage Plan
**"Airbnb for Warehouses": a verified marketplace for industrial and warehouse space**
Version 1.0 · 18 Nov 2026

---

## 0. Summary

**What we are building:** a two-sided marketplace where **companies (tenants)** find, compare, visit, book and pay for verified warehouse space, and **owners (landlords, developers, 3PLs)** list space, get qualified leads and collect rent. Everything happens in one place: search, quotes, site visit, agreement and payments.

**Why we can win where portals fail:**
1. **Verified data.** Portals like 99acres and MagicBricks carry stale or fake industrial listings. We physically verify every listing: clear height, docks, Fire NOC and title.
2. **Structured specs.** Tenants compare on 30+ technical fields such as clear height, floor load, docks and power. On a portal they read a free-text description.
3. **Transaction, not just leads.** We handle the LOI, the agreement, e-stamping, a deposit escrow and rent collection. This is the Airbnb part: we own the trust and the money flow.
4. **Flexible storage.** We sell per-pallet and per-sq-ft-per-month space for short terms, which no traditional broker sells.
5. **Hyper-local start.** We begin in Chakan, Talegaon and Bhosari MIDC (the Pune auto belt) and the OEM supplier ecosystem around Volkswagen, Bajaj, Mahindra, Mercedes-Benz and Tata. We win one cluster before we expand.

> **Positioning fix:** the home page claims "25 cities" while the brand is "Chakan MIDC Force". Pick one. **Recommendation:** keep the hyper-local brand for launch and use the claim *"Pune's verified industrial space marketplace, starting with Chakan MIDC"*. Show only real numbers. Fake stats destroy trust in B2B.

---

## 1. Screenshot audit (current build)

### 1.1 What is already good
- Clean, modern UI. Two clear CTAs: Find space and List warehouse.
- The home search bar has the right four fields: Location, Storage type, Area, Move-in.
- The storage category taxonomy is strong: General/Dry, Cold, Climate-controlled, E-com, 3PL, Cross-dock, Hazmat, Pharma, Food, Bonded/SEZ, Auto parts, Open yard.
- The listing wizard has a good structure: Basic, Location, Infrastructure, Compliance, Pricing, Photos, with Save Draft.
- The local context is smart: the OEM landmarks, the "Inside MIDC Zone" flag and the 40-ft container access flag.
- The company dashboard concept (Saved, Requests, Quotes, Bookings) is the right mental model.

### 1.2 Bugs and UX problems to fix now

| # | Screen | Problem | Fix |
|---|---|---|---|
| 1 | Home: category chips | A native grey horizontal scrollbar is visible and looks broken | Hide the scrollbar (`scrollbar-width:none`), add fade edges and arrow buttons, or wrap the chips like the search page does |
| 2 | Home: stats card | "120K sq ft / 25 cities / 4.8 rating" looks invented | Show real live counts from the DB, or remove the card until the numbers are real |
| 3 | Company dashboard | The quotes table overflows to the right (Status column is cut off) | Make the table responsive: horizontal scroll inside the card, or cards on mobile |
| 4 | Company dashboard | The text says "Compare price, area, deposit, compliance" but the table shows no deposit or compliance | Add ₹/sq ft, deposit, lock-in, escalation and compliance-badge columns, plus a **Compare** button |
| 5 | Company dashboard | Rows have no actions | Add row actions: View, Accept, Counter-offer, Reject, Schedule visit, Message |
| 6 | Search page | "All" and "Filters" look like the same type of chip | Make "Filters" a distinct button that opens a drawer; chips are only quick toggles |
| 7 | Search page | No result count, sort or list/map split | Add "128 spaces · Sort: Relevance / Price / Area / Distance" and a split list + map view |
| 8 | Wizard stepper | The step labels have a grey highlight that looks like selected text | Remove the background and style done / current / pending states properly |
| 9 | Wizard: Location | "40-ft Container Accessible" is **pre-checked** | Default every compliance or capability claim to **unchecked**. Pre-checked claims create false listings |
| 10 | Wizard: Compliance | "Fire NOC Confirmed" is **pre-checked** with no document | Leave it unchecked and **require a Fire NOC upload with an expiry date** before showing a Verified badge |
| 11 | Wizard: Basic | City is free text but Micro-market is a dropdown | Use a city dropdown, then a dependent micro-market dropdown, then a **map pin** |
| 12 | Wizard: Basic | Storage type is single-select | Make it multi-select with one "primary" type, because a warehouse can be Dry + Auto parts + 3PL |
| 13 | Wizard: Location | Distances are manual dropdowns | Auto-calculate them from the map pin (Google Distance Matrix) and let the owner override |
| 14 | Wizard: Photos | A pink error banner appears only at the last step | Validate each step on "Next" and show field-level errors inline |
| 15 | Wizard: Pricing | "No lock-in" shows a text cursor; it looks like an input, not a select | Use a proper select component |
| 16 | Global | The header has ♡, ☰ and 👤 icons with no labels | Add tooltips and aria-labels, and show the user's name or avatar when logged in |

### 1.3 Missing fields in the listing wizard (critical for industrial tenants)

**Basic details (add):** full address, PIN code, survey/plot number, MIDC plot number, total built-up area, **available area range (min to max divisible)**, number of units, building type (PEB / RCC / shed / open land), age of building, ownership type (owner / developer / 3PL / sub-lease).

**Location (add):** **map pin plus lat/long**, distance to Pune–Nashik Highway (NH-60) and the Mumbai–Pune Expressway, distance to JNPT port, Pune airport, Chakan bus stand and the nearest labour colony, approach road type (concrete or tar), truck turning radius, whether heavy vehicles may enter during day or night hours.

**Infrastructure (add):**
- Clear height at **eaves** and at **centre** (both)
- Number of **docks**, dock height, **dock levelers** (yes/no), dock shelters
- Column spacing (span), roof type (PEB with insulation or turbo ventilators), skylights / natural light %
- Truck parking bays, trailer parking, office area (sq ft), canteen, washrooms (gender-separate), driver rest room
- Racking available (selective / VNA / mezzanine), and whether it is included in rent
- Lighting (LED, lux level), ventilation, temperature range (cold or climate storage), humidity control
- CCTV, 24×7 security guards, boundary wall, weighbridge, material handling (forklift / EOT crane and its tonnage)
- Water supply, drainage, STP

**Compliance and documents (add; each needs an upload and an expiry date):**
- Fire NOC (with validity), Occupancy / Completion Certificate, approved building plan
- MIDC allotment letter / lease deed, 7/12 extract or property card, NA order (for non-MIDC land)
- MPCB consent (Consent to Establish / Operate), if applicable
- PESO licence (hazmat / petroleum), FSSAI-compatible (food grade), drug storage suitability (pharma), bonded warehouse licence (customs)
- Property insurance, structural stability certificate
- Owner KYC: PAN, GST number, cancelled cheque, Aadhaar-based e-KYC of the signatory

**Pricing (add):**
- Asking rent (₹/sq ft/month), **CAM / maintenance** (₹/sq ft), **security deposit** (in months), **annual escalation %** (usually 4–5% a year or 15% every 3 years)
- **Rent-free fit-out period** (days), lock-in period, **lease tenure** (years), notice period
- Whether GST applies on rent (18% for commercial), whether power is billed separately, whether brokerage applies
- **Flexible pricing (our USP):** per pallet per week/month, per sq ft for short-term use (1–6 months), and the price for value-added services (loading/unloading, pick-pack, labelling)
- Negotiable toggle and best-price floor (private, used for auto-matching)

**Photos and media (add):** minimum 8 photos with required slots (front elevation, approach road, dock area, interior wide, flooring, roof, office, parking), a walkthrough video, a **floor plan / site layout PDF**, an optional 360° tour and a drone shot. Compress images and add a watermark on upload.

**Final step (add): Review & Submit.** Show a summary of all fields, a "Listing quality score" (for example "82%: add a floor plan to reach 95%"), consent to the terms, and then submit to the **verification queue**. The listing does not go live directly.

---

## 2. Competitor and similar-platform analysis

> These profiles are based on public product information up to 2026. Re-check current pricing and features before you use them in a pitch deck.

| Platform | Market | Model | What they do well | What we copy or improve |
|---|---|---|---|---|
| **FLEXE** | US | On-demand warehousing network for enterprises | Pay only for space used, a single contract across many warehouses, API/WMS integration | Flexible per-pallet storage, and one contract with many sites for multi-city clients |
| **Warehouse Exchange** | US | Marketplace for space and 3PL services | Tenants post one requirement and many providers quote | Our **RFQ flow**: post a requirement once and get several quotes |
| **Stord** | US | Tech-enabled fulfilment network | Inventory visibility, order management | Phase 3: an inventory dashboard for 3PL-run spaces |
| **Saltbox** | US | Co-warehousing for small e-com sellers | Small units, shared docks, monthly membership | **Shared/co-warehousing units** of 500–2,000 sq ft for MSMEs |
| **Neighbor** | US | P2P storage ("Airbnb for storage") | Host/renter reviews, host protection, instant booking, monthly auto-pay | Two-way reviews, an insurance/protection add-on, auto-pay |
| **Waredock** | EU | On-demand warehousing marketplace | Instant online quotes for pallet storage | An **instant quote calculator** (pallets × weeks = ₹) |
| **WareOnGo** | India | On-demand warehousing and leasing | Indian industrial focus, managed leasing | Proof that Indian demand exists; we beat them on hyper-local verification depth |
| **Shiprocket Fulfillment / WareIQ** | India | Fulfilment-as-a-service for D2C | Plug-and-play with e-com channels | Partner with them rather than compete; list their spare capacity |
| **99acres / MagicBricks** | India | Classified listings | Huge traffic, SEO | Weak verification, poor specs, spam calls. **This is the gap we fill** |
| **NoBroker** | India | No-brokerage residential | Paid owner/tenant plans, legal and agreement services | Agreement plus e-stamp as a paid service, subscription plans |
| **IndoSpace / ESR / Welspun One / Horizon** | India | Grade-A industrial park developers | Large, compliant parks; their own leasing teams | **Onboard them as premium suppliers** with developer dashboards and bulk listing |
| **JLL / CBRE / Knight Frank / Cushman** | India | Traditional brokers (often about 1–2 months' rent as fee) | Relationships, large deals | Undercut them on fee and speed; their weak point is a slow, opaque process |
| **Airbnb** (UX reference) | Global | Marketplace UX standard | Map plus list search, wishlists, reviews, host-guest messaging, payout schedule, superhost badge | Copy the **UX patterns**, not the brand: map search, saved lists, Superhost becomes "Verified Pro Owner" |

**The gap no one in India fills well:** a single product that combines *verified* industrial specs, a transparent comparison, online deal closing (LOI, agreement, e-stamp, escrow) **and** flexible short-term storage, with deep coverage of one cluster.

---

## 3. User roles

| Role | Who | Main goals |
|---|---|---|
| **Company / Tenant** | Auto-component makers, e-com sellers, FMCG, 3PLs, pharma, importers | Find a compliant space fast, compare quotes, close the deal safely |
| **Owner / Landlord** | Individual plot owners, MIDC allottees, developers, 3PLs with spare space | Fill vacancy fast, get serious leads only, collect rent on time |
| **Channel partner / Broker** | Local brokers who already have inventory | List on behalf of owners and earn a revenue share. *Do not fight local brokers in Chakan; onboard them.* |
| **Field verifier** | Our staff or freelance surveyors | Visit sites, measure, photograph, upload a verification report from a mobile app |
| **Relationship manager (RM)** | Our sales and ops team | Handle large requirements (over 50k sq ft), negotiate, run site visits |
| **Admin / Super admin** | Internal | Approve listings, run KYC, settle disputes, manage payouts, CMS, analytics |
| **Finance** | Internal | Reconcile escrow, invoices, GST, TDS, payouts |

Accounts are **organisation-based**. A company has several users (procurement head, finance, legal) with roles Admin / Approver / Viewer. Every company user and owner signs in with mobile OTP plus email, and must verify their GST/PAN before transacting.

---

## 4. Core user journeys

### 4.1 Tenant journey (Company)
```
Land on home → Search (city / micro-market / type / area / move-in date)
  → Results (list + map, filters, sort)
  → Listing detail (specs, photos, verified badge, price breakdown, nearby OEMs)
  → [A] Shortlist ♡ → Compare (up to 4 side by side)
  → [B] "Request quote" (own requirement, date, tenure)
  → [C] "Schedule site visit" (pick a slot; RM or owner confirms)
  → Receive quotes → Compare → Counter-offer / Negotiate (in chat)
  → Accept → Pay token amount (refundable or adjustable, through escrow)
  → LOI generated → e-sign by both parties
  → Agreement (Leave & Licence / Lease) drafted from a template → e-stamp → e-sign
     → registration (in Maharashtra, Leave & Licence registration is mandatory)
  → Pay security deposit (escrow) → Handover checklist + move-in photos
  → Active booking: monthly rent auto-pay, invoices, support tickets
  → Renewal alert 90/60/30 days before expiry → Renew / Exit (deposit refund flow)
  → Review the owner and the space
```

**Alternative flow: "Post a requirement" (RFQ).** The tenant fills one form: area, city, type, budget, date, special needs (docks, height, power). The platform **auto-matches** listings and notifies the owners. Owners send quotes within 48 hours, and the tenant gets a comparison table. This is the most valuable B2B flow; make it a top CTA.

**Flexible storage flow (instant booking).** Pick a warehouse that has "Flex" enabled, enter pallets or sq ft, start date and duration, see an instant price, pay, get a booking confirmation and a gate pass. This is the true "Airbnb" moment.

### 4.2 Owner journey
```
Sign up (OTP) → KYC (PAN, GST, bank) → List space (7-step wizard, auto-save)
  → Submit → Verification queue → Field visit scheduled → Verified badge → LIVE
  → Receive leads / RFQs (WhatsApp + email + in-app) → Send quote (template)
  → Chat, site-visit calendar → Negotiate → Accept
  → LOI / agreement e-sign → Receive token & deposit (escrow released per milestone)
  → Monthly rent payouts (T+2) → Statements, GST invoices, TDS certificates
  → Occupancy calendar: mark space as partially or fully leased
  → Performance analytics: views, leads, response time, conversion
```

### 4.3 Admin / Ops journey
```
Listing submitted → Auto checks (duplicate photos, missing documents, price outlier)
  → Assign a field verifier → Mobile app: GPS-tagged photos, measurements, checklist
  → Review report → Approve / Reject with reasons / Request changes
  → Monitor deals → SLA alerts (owner did not respond in 24h)
  → Disputes → Escrow hold / release → Payout run → Reports
```

---

## 5. Feature specification by module

Priority: **P0 = MVP** (launch), **P1 = 3–6 months after launch**, **P2 = scale phase**.

### 5.1 Public website and SEO
| Feature | Priority | Details |
|---|---|---|
| Home page | P0 | Hero, search bar, categories, featured verified spaces, "How it works" for tenants and owners, trust strip (verification process), real stats, testimonials, FAQ |
| SEO landing pages | P0 | `/warehouse-for-rent/chakan`, `/cold-storage/pune`, `/warehouse/chakan/50000-sqft` and so on, generated from the DB with schema.org markup. Industrial search traffic is high-intent and cheap |
| Micro-market guides | P1 | A "Chakan MIDC Phase 1–4" page: average rent, availability, connectivity, nearby OEMs, labour availability |
| Rent index / market report | P1 | A quarterly public "Chakan Warehouse Rent Index". It earns PR and backlinks and positions us as the authority |
| Blog / resources | P1 | Guides: Leave & Licence agreements, GST on rent, Fire NOC, choosing a clear height |
| Multilingual | P2 | English, Hindi and Marathi, because many owners are Marathi-first |

### 5.2 Search and discovery
| Feature | Priority | Details |
|---|---|---|
| Keyword plus location search | P0 | Autocomplete for city, micro-market, MIDC phase and landmark ("near Bajaj Chakan") |
| Quick-filter chips | P0 | The storage types from the current build |
| Advanced filters drawer | P0 | Area min–max, rent range, clear height ≥, docks ≥, floor load ≥, power KVA ≥, inside MIDC, 40-ft access, Fire NOC valid, available from, lease tenure, grade (A/B/C), PEB/RCC, open land, racking included, flex/short-term available |
| Map view | P0 | Split list + map, price pins, cluster markers, "search this area" and draw-on-map |
| Sort | P0 | Relevance, price low→high, area, newest, distance to a chosen point, verification score |
| Result card | P0 | Photo carousel, name, micro-market, available area, ₹/sq ft, clear height, docks, Verified badge, ♡ save, "Request quote" |
| Saved searches plus alerts | P1 | "Notify me when a 20–30k sq ft space is listed in Chakan" by WhatsApp or email |
| Distance-to-my-plant | P1 | The tenant enters their factory location, and every result shows the drive time to it |
| Recently viewed | P1 | |
| AI requirement search | P2 | Natural-language search, for example "15k sqft near Mahindra Chakan, 10m height, 2 docks, by March", which is parsed into filters |

### 5.3 Listing detail page
| Section | Priority | Content |
|---|---|---|
| Gallery | P0 | Photos, video, floor plan, 360° tour (P1) |
| Header | P0 | Name, location, Verified badge with verification date, ♡, share, report listing |
| Key specs strip | P0 | Area available, ₹/sq ft, clear height, docks, floor load, power, Fire NOC status |
| Full specs | P0 | Grouped as Building, Location, Infrastructure, Compliance, Commercials |
| **Price breakdown** | P0 | Rent + CAM + GST = total monthly; deposit; escalation; estimated first-year cost; total cost over the lock-in period |
| Location | P0 | Map, distances (highway, airport, rail, port, OEM plants), nearby amenities |
| Availability | P0 | "Available from" date, divisible units, occupancy bar |
| Owner card | P0 | Owner type, response rate, response time, years on the platform. Show the phone only after a verified enquiry, to prevent spam |
| CTAs (sticky) | P0 | Request quote, Schedule visit, Chat, Book flex space (if enabled) |
| Verification report | P1 | Downloadable PDF from the field verifier: measured height, photos, checklist |
| Reviews | P1 | Ratings for accuracy, owner responsiveness, maintenance, location |
| Similar spaces | P0 | |

### 5.4 Listing creation (Owner)
The current 6-step wizard plus all the fields in §1.3, and also:
- **Auto-save** every step (P0) and resume the draft from the dashboard.
- **Per-step validation** with inline errors (P0).
- **Multiple units per property** (P0), for example Unit A 20k sq ft and Unit B 35k sq ft, each with its own availability and price.
- **Listing quality score** (P0) that nudges owners to complete it.
- **Pricing suggestion** (P1): "Similar spaces in Chakan Phase 2 rent at ₹22–26 per sq ft."
- **Duplicate detection** (P0): by photo hash, coordinates and owner.
- **Bulk upload** via CSV or Excel for developers (P1).
- **Listed by a broker for an owner** (P1) with the owner's consent captured by OTP.
- **Assisted listing** (P0): a button that says "Our team will list it for you". Many owners will not fill a 7-step form, so a WhatsApp call-back books a field visit.

### 5.5 Verification and trust (our moat)
| Feature | Priority | Details |
|---|---|---|
| Owner KYC | P0 | PAN, GST and bank verification through APIs (penny drop), plus Aadhaar e-KYC of the signatory |
| Document verification | P0 | Ops reviews the Fire NOC, OC, title and MIDC allotment; expiry dates are tracked |
| Physical verification | P0 | A field verifier visits, takes GPS and time-stamped photos and measures height and docks |
| Badges | P0 | **Verified** (documents plus visit), **Docs pending**, and later **Pro Owner** (fast response, good reviews) |
| Re-verification | P1 | Every 6 months, or when documents expire; the badge is auto-removed on expiry |
| Report listing | P0 | "Already leased", "wrong info", "fake" |
| Tenant verification | P0 | Company GST/CIN check, so owners see that leads are genuine businesses |
| Fraud controls | P0 | No off-platform payment requests in chat (keyword detection plus warning), and rate limits on contact reveals |

### 5.6 Requirements (RFQ) and quotes
| Feature | Priority | Details |
|---|---|---|
| Post a requirement | P0 | Area, location radius, type, budget, start date, tenure, must-have specs, documents needed |
| Auto-matching | P0 | A rules-based score (area fit, location, specs, price) notifies the top owners |
| Owner quote form | P0 | Rent, CAM, deposit, escalation, lock-in, rent-free period, fit-out by the owner, validity date, terms, PDF attachment |
| **Quote comparison table** | P0 | Side by side, with the effective cost per sq ft and the **total cost of occupancy** over the lock-in period, so offers are comparable. Highlight the best on each row |
| Negotiation | P0 | Counter-offer flow with version history (Quote v1 → Counter → v2), status chips: Received / Viewed / Negotiating / Accepted / Rejected / Expired |
| Expiry plus reminders | P0 | Auto-expire on "valid until"; remind 48h before |
| RM-assisted deals | P0 | Requirements over 50k sq ft or flagged "urgent" are assigned to an RM |
| Internal approval | P1 | The company user sends a quote to their manager inside the platform, and the manager approves |

### 5.7 Site visits
| Feature | Priority | Details |
|---|---|---|
| Visit scheduling | P0 | The owner sets available slots; the tenant books; both get WhatsApp and calendar invites |
| Multi-site visit plan | P1 | Visit 4 warehouses in one day on an optimised route, with an RM escort |
| Visit feedback | P0 | After the visit, the tenant rates the space and gives a reason if not interested, which helps the owner and matching |
| Virtual visit | P1 | A live video walkthrough by the owner or verifier |

### 5.8 Deal closing: LOI, agreement, e-sign
| Feature | Priority | Details |
|---|---|---|
| LOI generator | P0 | Auto-filled from the accepted quote; e-signed by both parties |
| Agreement templates | P0 | Leave & Licence (most common in Maharashtra), Lease Deed and Warehousing Service Agreement (for flex/3PL). Clauses are lawyer-vetted; parties can propose edits with tracked changes |
| E-stamping plus e-sign | P0 | Through an authorised e-stamp/e-sign provider (Aadhaar e-sign or DSC) |
| Registration support | P1 | Book Leave & Licence registration online or with a doorstep biometric visit |
| Handover checklist | P0 | Move-in condition photos signed off by both sides; this protects the deposit refund later |
| Document vault | P0 | All deal documents per booking, downloadable at any time |

### 5.9 Payments and finance
| Feature | Priority | Details |
|---|---|---|
| Token amount | P0 | Paid online through a payment gateway (Razorpay or Cashfree) and held in an escrow/nodal account. Adjusted against the deposit, or refunded under clear rules |
| Security deposit escrow | P1 | Deposit held by the escrow partner; released to the owner on move-in or kept in escrow until exit (a strong trust selling point) |
| Monthly rent | P0 | Invoice each month, auto-pay through UPI AutoPay, e-NACH or card, and reminders on day −3, 0 and +3 |
| GST invoices | P0 | The owner's GST invoice for rent; our GST invoice for the platform fee |
| TDS | P0 | The tenant deducts TDS on rent (Section 194-I) and uploads Form 16A, and the owner sees it; this is a big pain point today |
| Owner payouts | P0 | T+2 settlement to the verified bank account, with statements |
| Late fees plus dunning | P1 | Configurable by agreement |
| Deposit refund flow | P1 | Exit inspection, then deductions with photos, then the refund |
| Financing partners | P2 | Rent-deposit financing for MSMEs, invoice discounting for owners |

### 5.10 Flexible / on-demand storage ("Airbnb mode")
| Feature | Priority | Details |
|---|---|---|
| Flex inventory | P1 | The owner enables "Flex" for part of the space and sets capacity in pallets or sq ft and rates per week or month |
| Instant quote calculator | P1 | Pallets × duration plus handling charges = a price shown on screen |
| Instant booking | P1 | Pay and confirm without negotiation, within the available capacity |
| Gate pass plus inward/outward log | P2 | A QR gate pass for trucks; the owner logs inward and outward movements |
| Inventory dashboard | P2 | SKU-level stock for 3PL-run spaces (integrate with the owner's WMS or offer a lite WMS) |
| Value-added services | P2 | Loading, labour, pick-pack, transport booking (partner with trucking platforms) |
| Insurance add-on | P2 | Goods-in-storage insurance at checkout, through an insurance partner |

### 5.11 Messaging and notifications
| Feature | Priority | Details |
|---|---|---|
| In-app chat | P0 | Per listing or deal thread, attachments, read receipts, quote cards inside the chat |
| **WhatsApp notifications** | P0 | In India this matters more than email: new lead, quote, visit reminder, payment due. Use the WhatsApp Business API |
| Email plus SMS | P0 | Transactional emails and OTPs |
| Contact masking | P0 | Phone numbers are masked until both sides agree, so the deal stays on the platform and spam is avoided |
| Notification preferences | P1 | Per channel and per event |

### 5.12 Dashboards
**Company dashboard** (improving the current one):
- Overview: Saved, Open requests, Quotes received, Visits scheduled, Active bookings, Rent due this month
- **Warehouses**: active leases with area, rent, expiry and a renewal countdown
- **Requests**: each RFQ with its matched count and quotes received
- **Quotes**: comparison table and actions (see §1.2 #4 and #5)
- **Visits**: calendar
- **Payments**: invoices, paid/due, TDS uploads, receipts
- **Documents**: LOIs, agreements, NOCs
- **Messages**
- **Analytics**: total spend, ₹/sq ft across sites, space utilisation, upcoming expiries
- **Team & Settings**: invite users, roles, GST details, billing entity

**Owner dashboard:**
- Overview: live listings, views, leads, quotes sent, occupancy %, rent collected, pending payouts
- Listings: status (Draft / In verification / Live / Leased / Paused), quality score, edit, pause
- Leads and RFQs inbox with a response timer ("Respond within 24h to keep your Pro badge")
- Quotes, Visits calendar, Deals pipeline (Kanban: Lead → Visit → Quote → Negotiation → LOI → Agreement → Live)
- Tenants and leases: rent roll, expiries, escalation schedule
- Payouts and statements, GST and TDS reports
- Analytics: views versus similar listings, price competitiveness, lead-to-deal conversion

**Admin console:**
- Verification queue with SLA, field-verifier assignment, approval with a checklist
- User and organisation management, KYC status, bans
- Deal monitoring, RM assignment, disputes
- Payments: escrow ledger, payouts, refunds, reconciliation
- CMS: home page, SEO pages, blog, FAQ
- Master data: cities, micro-markets, storage types, landmarks, amenities
- Reports: GMV, take rate, funnel, supply and demand by micro-market
- Audit log of every admin action

### 5.13 Reviews and reputation
- Two-way reviews after move-in (30 days) and at exit (P1)
- Owner metrics: response rate, response time, listing accuracy (P0, computed automatically)
- "Pro Owner" badge (P1)

### 5.14 Post-move-in (retention: this is where long-term revenue comes from)
- Maintenance tickets with photos and an SLA, raised by the tenant and handled by the owner (P1)
- Renewal workflow at 90/60/30 days, with a renegotiation quote (P1)
- Expansion requests ("Need 10k sq ft more nearby"), which feed back into the RFQ flow (P1)
- Exit workflow: notice, inspection, deposit refund (P1)
- Compliance expiry alerts to both sides, for example Fire NOC expiring in 30 days (P1)

---

## 6. Business model

| Revenue stream | Who pays | Suggested pricing (to be validated) | Phase |
|---|---|---|---|
| Success fee on long-term leases | Owner (and optionally the tenant) | 15–30 days' rent, well below the usual broker fee of about 1–2 months | P0 |
| Flex storage commission | Built into the price | 10–15% of booking value | P1 |
| Owner subscriptions | Owner / developer | Free basic plan; Pro plan for featured placement, analytics and priority verification | P1 |
| Featured listings / boosts | Owner | Pay per week | P1 |
| Agreement plus e-stamp service | Either | Flat fee per agreement | P0 |
| Rent collection / escrow fee | Owner | 0.5–1% of collected rent | P1 |
| Value-added services | Tenant | Margin on labour, transport, insurance | P2 |
| Data / market reports | Developers, investors, banks | Paid reports | P2 |

**Launch go-to-market:** use free listings plus assisted listing to get supply. Field-verify the first 100 Chakan listings. Run outbound sales to the procurement and admin heads of Tier-1 and Tier-2 auto suppliers. Partner with local brokers through a revenue share.

---

## 7. Status logic (state machines)

**Listing:** `Draft → Submitted → In verification → (Changes requested ↺) → Live → Partially leased → Fully leased / Paused / Expired / Rejected`

**Requirement (RFQ):** `Open → Matched → Quotes received → Shortlisted → Closed (Won / Lost / Cancelled / Expired)`

**Quote:** `Sent → Viewed → Countered ↺ → Accepted / Rejected / Expired / Withdrawn`

**Deal / Booking:** `Accepted → Token paid → LOI signed → Agreement signed → Deposit paid → Handover done → Active → Renewal due → Renewed / Notice given → Exit inspection → Deposit settled → Closed`

**Payment:** `Created → Pending → Success / Failed → (Refund initiated → Refunded)`; escrow `Held → Released / Refunded / Disputed`

Each transition triggers notifications plus an audit-log entry.

---

## 8. Core data model (main entities)

- **Organization** (type: tenant / owner / broker; GSTIN, PAN, CIN, KYC status) has many **Users** (role per org)
- **Property** (address, lat/long, micro-market, MIDC flag, building specs) has many **Units** (area, availability, price, flex settings)
- **Media** (photo, video, floor plan; slot type), **Document** (type, file, expiry, verified_by)
- **Verification** (property, verifier, checklist JSON, GPS photos, result)
- **Requirement** (tenant org, specs, budget, dates) has many **Matches** and **Quotes** (versions)
- **Visit** (unit, slot, status, feedback)
- **Deal** (quote, parties, status) has an **Agreement** (template, e-sign status, stamp, registration), **Payments**, **Invoices**, **Payouts**, **Escrow entries**
- **Lease** (start, end, rent schedule, escalations)
- **Conversation / Message**, **Notification**, **Review**, **Ticket**, **SavedSearch**, **Favorite**, **AuditLog**
- Master data: **City**, **MicroMarket**, **StorageType**, **Landmark**, **Amenity**

---

## 9. Suggested tech stack (lean, matches the current Vercel deployment)

- **Frontend and backend:** Next.js (App Router) with TypeScript, Tailwind and shadcn/ui, deployed on Vercel
- **Database:** PostgreSQL with **PostGIS** (Supabase or Neon) for geo search. Postgres full-text search is enough at launch; add Typesense or Meilisearch only when search gets slow
- **Auth:** phone OTP plus email (Supabase Auth or Clerk); org-based access control enforced in the DB (row-level security)
- **Files:** S3 or Supabase Storage with image compression and watermarking
- **Maps:** Google Maps Platform (Places autocomplete, Distance Matrix) or Mapbox
- **Payments:** Razorpay or Cashfree (gateway, UPI AutoPay, payouts, escrow through a partner bank)
- **E-sign / e-stamp:** an Indian e-sign provider (Aadhaar e-sign)
- **Messaging:** WhatsApp Business API provider, plus email (Resend or SES) and SMS (MSG91)
- **Field-verifier app:** a mobile-friendly PWA with camera and GPS (no native app needed at launch)
- **Analytics:** PostHog for funnels; Sentry for errors
- **Compliance:** DPDP Act 2023 (consent, data deletion, privacy policy), encryption of KYC documents, audit logs

---

## 10. Roadmap

**Phase 0: Fix and foundation (2–3 weeks)**
- Fix every item in §1.2
- Real auth (OTP), org accounts, a real DB (no hard-coded demo numbers)
- Complete the wizard fields (§1.3), add a Review & Submit step and the verification queue

**Phase 1: MVP marketplace (6–8 weeks)**
- Search, filters, map, listing detail and price breakdown
- RFQ, matching, quotes, comparison and negotiation
- Site visits, chat, WhatsApp notifications
- Owner KYC, document and physical verification, badges
- LOI plus agreement templates with e-sign; token payment
- Company, owner and admin dashboards (core)
- SEO pages for Chakan, Talegaon, Bhosari and Ranjangaon
- **Target:** 100 verified listings and the first 10 deals closed in the Chakan belt

**Phase 2: Transactions and retention (3–6 months)**
- Rent auto-pay, invoices, TDS, payouts, deposit escrow
- Flex storage with instant booking
- Reviews, Pro badge, saved-search alerts, renewal and maintenance workflows
- Owner subscriptions, featured listings, analytics, the rent index
- Expand to Pune East (Wagholi, Lonikand) and Bhiwandi

**Phase 3: Scale and network (6–12 months)**
- Multi-city expansion (Bhiwandi, NCR, Chennai, Bengaluru, Ahmedabad)
- Inventory or lite-WMS for flex, gate pass, VAS marketplace (labour, transport, insurance)
- AI requirement search and smart pricing
- Developer and enterprise APIs, a multi-site single contract (the FLEXE model)
- Financing partnerships

---

## 11. KPIs to track from day 1

- **Supply:** listed sq ft, verified sq ft, verification turnaround time, listing quality score
- **Demand:** RFQs posted, sq ft requested, searches with zero results (these show where to add supply)
- **Liquidity:** % of RFQs that receive 3 or more quotes within 48h, owner response time
- **Funnel:** search → detail → enquiry → visit → quote → LOI → deal (conversion at every step)
- **Money:** GMV (annual lease value), take rate, revenue, collection rate of rent, payment delay days
- **Trust:** listing accuracy complaints, disputes, NPS for tenants and for owners
- **Retention:** renewal rate, repeat tenants, expansion requests

---

## 12. Key risks and how to handle them

| Risk | Mitigation |
|---|---|
| Disintermediation (both sides go off-platform after the first contact) | Contact masking, value delivered after contact (agreement, escrow, rent collection, TDS), and a fee lower than brokers so there is no reason to bypass |
| Owners will not self-list | Assisted listing via WhatsApp and field teams; broker partnerships |
| Fake or stale listings | Mandatory verification, auto-expiry of availability every 30 days unless the owner confirms, and "report listing" |
| Chicken-and-egg problem | Supply first in one cluster (Chakan), then targeted outbound demand to auto suppliers |
| Legal and payment compliance | Lawyer-vetted templates; a regulated payment and escrow partner (never hold money in our own account); DPDP compliance |
| Long B2B deal cycles | RM-assisted deals for large requirements; flex storage gives fast, small wins and cash flow |

---

## 13. Immediate next steps (this week)
1. Fix the UI bugs in §1.2, especially the **pre-checked Fire NOC and 40-ft flags**, the table overflow and the fake stats.
2. Extend the wizard with the fields in §1.3 and add a Review & Submit step.
3. Add real actions to the quotes table plus a Compare view.
4. Define the verification checklist and run it on 10 real Chakan warehouses.
5. Talk to 10 owners and 10 tenants (procurement or logistics managers at auto suppliers) to validate the fee model before you build payments.
