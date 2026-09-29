# Backend Status — Supabase Integration Phase 1 Complete (Audited & Verified)

## Overview
This document tracks the integration status of the production-ready Supabase backend for **"I WILL BUY IT"**.

## Completed Milestones
- [x] Workspace & Git isolation confirmed (`backend/supabase-integration` branch).
- [x] Baseline commit checkpoint created (`59fb294`).
- [x] Preflight script created (`scripts/verify-launch-assets.ts`) and verified (14/14 master artwork files passed).
- [x] Manual admin provisioning file created (`supabase/manual/001_provision_admin.sql`).
- [x] SQL migration files created & updated under `supabase/migrations/`:
  - `20260909000000_initial_schema.sql` (12 relational tables including `rate_limits`, soft deletes, consent column `NOT NULL` without default true, DATE columns, `source_request_id` unique constraint, `ON DELETE RESTRICT` foreign key, `fk_requests_order` constraint)
  - `20260909000001_rls_policies.sql` (Hardened `is_admin()` function with `SET search_path = ''`, revoked public execute, revoked direct raw table access from `anon`/`public`, admin-only policies)
  - `20260909000002_storage_setup.sql` (Private `design-assets` and `request-uploads` buckets setup, updated `public`, `file_size_limit`, and `allowed_mime_types` on conflict)
  - `20260909000003_seed_official_designs.sql` (Seeds 7 launch designs with canonical static `/assets/designs/<slug>/master/...` paths)
  - `20260909000004_rpc_functions.sql` (Secured `submit_customer_request` with strict consent enforcement, `check_rate_limit` atomic single-statement upsert, and `convert_request_to_order` with authoritative DB order snapshots)
- [x] Server-side integration utilities & authorization layer implemented:
  - `lib/supabase/admin.ts` (Server-only privileged client with `import "server-only"`)
  - `lib/client-ip.ts` (Client IP extraction & server-secret HMAC hashing)
  - `lib/auth-guard.ts` (Active admin session and profile verification)
  - `middleware.ts` (Admin route redirect middleware)
- [x] API Route Handlers implemented:
  - `app/api/requests/create/route.ts` (Single multipart POST for public request creation with consent enforcement, orphan upload deletion & rate limiting)
  - `app/api/catalog/route.ts` (Public catalogue API endpoint returning safe published designs, available variants, and enabled sizes without raw storage paths)
  - `app/api/designs/artwork/[id]/route.ts` (Secure artwork proxy route handler checking published status or active admin authorization)
  - `app/api/admin/designs/route.ts` (Admin design CRUD, variant artwork upload with magic byte check & size management)
  - `app/api/admin/requests/route.ts` (Admin request workflow: status update, private notes, conversion)
  - `app/api/admin/orders/route.ts` (Admin order workflow: manual creation, payment/production updates, archiving)
  - `app/api/admin/inventory/route.ts` (Admin inventory management)
  - `app/api/admin/settings/route.ts` (Admin site settings)
- [x] Service layer updated (`services/auth.ts`, `services/uploads.ts`, `services/repository.ts`, `services/commerce.ts`).
- [x] Security integration test suite `tests/backend-security.spec.ts` created and passing (8/8 tests passed).
- [x] Next.js production build (`next build`) and TypeScript type-check passed with 0 errors.
- [x] Client JS bundle inspected for secret leakage (`SUPABASE_SECRET_KEY` and `RATE_LIMIT_HMAC_SECRET` absent from client JS bundles).

## Database / Migration Execution Order
1. `supabase/migrations/20260909000000_initial_schema.sql`
2. `supabase/migrations/20260909000001_rls_policies.sql`
3. `supabase/migrations/20260909000002_storage_setup.sql`
4. `supabase/migrations/20260909000003_seed_official_designs.sql`
5. `supabase/migrations/20260909000004_rpc_functions.sql`
6. `supabase/manual/001_provision_admin.sql` (In SQL Editor after creating admin in Auth Dashboard)

## Tests & Build Verification Status
- Asset Preflight Check: `PASSED` (14/14 master files verified)
- Next.js Production Build (`next build`): `PASSED` (17/17 static/dynamic pages compiled)
- TypeScript Typecheck (`tsc --noEmit`): `PASSED`
- ESLint (`eslint .`): `PASSED`
- Local Offline Backend Security Test Suite (`playwright test tests/backend-security.spec.ts`): `PASSED` (8/8 tests passed in 2.2s)
- Secret Leakage Check: `PASSED` (`SUPABASE_SECRET_KEY` and `RATE_LIMIT_HMAC_SECRET` verified absent from client JS bundles)

## External Action Needed (For Phase 2)
1. User executes SQL migration scripts in Supabase Dashboard SQL Editor in numerical order.
2. User creates admin account in Supabase Auth and provisions admin profile using `supabase/manual/001_provision_admin.sql`.
3. User adds `SUPABASE_SECRET_KEY` and `RATE_LIMIT_HMAC_SECRET` to `.env.local` locally.

## Files Changed in Phase 1
- `supabase/manual/001_provision_admin.sql`
- `supabase/migrations/20260909000000_initial_schema.sql`
- `supabase/migrations/20260909000001_rls_policies.sql`
- `supabase/migrations/20260909000002_storage_setup.sql`
- `supabase/migrations/20260909000003_seed_official_designs.sql`
- `supabase/migrations/20260909000004_rpc_functions.sql`
- `website-app/scripts/verify-launch-assets.ts`
- `website-app/lib/supabase/admin.ts`
- `website-app/lib/client-ip.ts`
- `website-app/lib/auth-guard.ts`
- `website-app/middleware.ts`
- `website-app/app/api/requests/create/route.ts`
- `website-app/app/api/catalog/route.ts`
- `website-app/app/api/designs/artwork/[id]/route.ts`
- `website-app/app/api/admin/designs/route.ts`
- `website-app/app/api/admin/requests/route.ts`
- `website-app/app/api/admin/orders/route.ts`
- `website-app/app/api/admin/inventory/route.ts`
- `website-app/app/api/admin/settings/route.ts`
- `website-app/services/auth.ts`
- `website-app/services/uploads.ts`
- `website-app/services/repository.ts`
- `website-app/services/commerce.ts`
- `website-app/tests/backend-security.spec.ts`
- `website-app/.env.local.example`
- `BACKEND_STATUS.md`

## Next Steps
- Await owner approval of updated Phase 1 migration files before executing Phase 2 remote database verification.
