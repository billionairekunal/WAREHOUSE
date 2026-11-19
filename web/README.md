# Chakan MIDC Force: web app

Next.js 16 (App Router) + Tailwind 4 + Supabase. A verified warehouse leasing marketplace.

## Run locally
```
npm install
npm run dev        # http://localhost:3000
```
`.env.local` (git-ignored) needs:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...   # server only, never NEXT_PUBLIC_
```

## Database
SQL lives in `supabase/migrations` (run in order) and `supabase/seed.sql` (8 sample listings, flagged `is_sample`).
Remove samples before launch: `delete from listings where is_sample;`

Security model (row-level security + triggers):
- Anyone can read `live`/`leased` listings; owners see and edit their own.
- New listings are always `draft`/`submitted`; only admins can publish or set `verified`.
- Quotes and visits are visible only to the two parties; each side can only edit its own fields.
- Make someone admin (SQL editor): `update profiles set role = 'admin' where id = '<user uuid>';`

## Routes
| Route | What |
|---|---|
| `/` | Landing: live stats, search, categories, featured verified spaces |
| `/search` | Filters (type, market, area, rent, height, docks, MIDC, verified, flex), sort, list + map |
| `/warehouse/[id]` | Gallery, specs, true-cost calculator, quote and site-visit requests |
| `/list-space` | 7-step listing wizard with photo upload and map pin |
| `/dashboard` | Company: quote comparison (accept / counter / reject), visits, saved. Owner: listings, quote requests, visits |
| `/admin` | **Admin console** (separate layout, admins only): Overview, Approvals, Listings, Users, Quotes, Site visits |

## Firebase (push notifications + Analytics)
- `NEXT_PUBLIC_FIREBASE_*` vars hold the public web config and the web-push (VAPID) key.
- Users opt in from the dashboard card; each device token is stored in `push_tokens` (only the owner can read their own).
- Pushes go out on: new quote request, quote sent / declined, counter / accept / reject, visit requested / confirmed / cancelled, listing approved / changes requested.
- **Sending needs a service account:** Firebase console → Project settings → Service accounts → Generate new private key, then put the JSON on one line in `.env.local` as `FIREBASE_SERVICE_ACCOUNT=...` (server only). Without it, everything else works and pushes are skipped.

## Not built yet
Document uploads (Fire NOC, OC) into a private bucket, in-app chat, WhatsApp notifications, payments, e-sign agreements, requirement posting (RFQ).
Map tiles come from tile.openstreetmap.org, which is fine for development; switch to a paid tile provider before launch.
