# Plan: move the database from Seoul to Mumbai

**Why:** customers are in Pune, but the Supabase database is in Seoul (ap-northeast-2). Every page waits for India ↔ Korea round trips.
**Goal:** database in **Mumbai (ap-south-1)** and Vercel servers in **Mumbai (bom1)** → pages should start showing in roughly **0.15–0.25 s** instead of 0.45–0.6 s.

Supabase cannot change a project's region, so we create a new project in Mumbai and copy everything into it.

## What has to move (checked 19 Nov 2026)
| Item | Amount |
|---|---|
| User accounts (with passwords) | 6 |
| Profiles | 6 |
| Warehouse listings | 9 |
| Quotes / site visits / saved / push tokens | 2 / 1 / 0 / 0 |
| Photos in storage | 8 files, 5.4 MB |
| Database size | 12 MB |
| Tables, security rules, triggers, photo bucket | 7 migration files in `web/supabase/migrations` |

## Steps

### Phase 0: prepare (no effect on the live site)
1. Create a new Supabase project in **Mumbai** in the same account. The account has 1 project, so a second free project fits.
2. Run the 7 migration files on it, which builds the same tables, security rules, triggers and photo bucket.
3. Copy the sign-in settings: site URL, redirect URLs, email confirmation.

### Phase 1: copy data (about 15 minutes, at a quiet time)
4. Copy **user accounts with their password hashes**, so everyone keeps their **same email and password**.
5. Copy the tables in order: profiles → listings → quotes → visits → saved → push tokens. Protective triggers are paused during the copy so data arrives exactly as it is.
6. Copy the **8 photos** into the new bucket and update each listing's photo links to the new address.
7. **Check that the counts match**: 6 users, 9 listings, 2 quotes, 1 visit and 8 photos.

### Phase 2: switch over (about 10 minutes)
8. Replace the **3 Supabase values** in Vercel: the new URL, publishable key and secret key. Also update `web/.env.local`.
9. Change the Vercel server region from Seoul (`icn1`) to Mumbai (`bom1`), then push and redeploy.
10. Confirm `/api/health` shows the Mumbai project, 9 listings and the photo bucket.
11. Test as a real user: sign in with an existing account, open a listing, upload a photo, request a quote and approve as admin.

### Phase 3: clean up (after 1 week)
12. Keep the Seoul project **paused as a backup** for a week, then delete it.

## What users will notice
- **Everyone is signed out once** and signs in again with the same email and password. No password reset is needed.
- Anything saved on the old site **during the 15-minute copy** would not carry over, so do it at night. Today's traffic is tiny.

## Safety: rollback in 5 minutes
The Seoul project is not touched. If anything looks wrong, put the old 3 Supabase values back in Vercel, set the region back to `icn1` and redeploy.

## Bonus
The new project comes with **brand-new keys**. This replaces the secret key and access token that were pasted in chat earlier.

## Who does what
| Step | Who |
|---|---|
| Create the project, copy schema, data and photos, verify counts, push the region change | Claude (with the Supabase access token) |
| Approve creating the new project | You |
| Paste the 3 new values into Vercel and click Redeploy | You (Claude gives the exact copy-paste block) |
| Final check on your phone | You |

**Total time:** about 45 minutes, of which about 15 minutes are a quiet "do not use" window.
