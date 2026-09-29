import { test, expect } from "@playwright/test";
import { verifyLaunchAssets } from "../scripts/verify-launch-assets";
import fs from "fs";
import path from "path";

test.describe("Local Offline Backend Security & Architecture Verification", () => {
  test("1. Preflight launch asset verification passes for all 14 official files", () => {
    const result = verifyLaunchAssets();
    expect(result.success).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  test("2. SQL initial schema migration defines consent NOT NULL without default true", () => {
    const schemaSql = fs.readFileSync(
      path.join(process.cwd(), "supabase", "migrations", "20260909000000_initial_schema.sql"),
      "utf-8",
    );

    expect(schemaSql).toContain("consent BOOLEAN NOT NULL");
    expect(schemaSql).not.toContain("consent BOOLEAN NOT NULL DEFAULT true");
    expect(schemaSql).toContain("fk_requests_order");
  });

  test("3. SQL RLS policies explicitly revoke raw-table access from public and anon", () => {
    const rlsSql = fs.readFileSync(
      path.join(process.cwd(), "supabase", "migrations", "20260909000001_rls_policies.sql"),
      "utf-8",
    );

    expect(rlsSql).toContain("SET search_path = ''");
    expect(rlsSql).toContain("REVOKE ALL ON public.designs FROM anon, public;");
    expect(rlsSql).toContain("REVOKE ALL ON public.design_variants FROM anon, public;");
    expect(rlsSql).toContain("REVOKE ALL ON public.requests FROM anon, public;");
    expect(rlsSql).toContain("REVOKE ALL ON public.rate_limits FROM anon, public, authenticated;");
  });

  test("4. Storage setup migration updates public, file_size_limit, and allowed_mime_types on conflict", () => {
    const storageSql = fs.readFileSync(
      path.join(process.cwd(), "supabase", "migrations", "20260909000002_storage_setup.sql"),
      "utf-8",
    );

    expect(storageSql).not.toContain("image/svg+xml");
    expect(storageSql).toContain("ON CONFLICT (id) DO UPDATE SET");
    expect(storageSql).toContain("allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp']");
  });

  test("5. RPC functions migration implements consent check, atomic rate limit, and authoritative snapshots", () => {
    const rpcSql = fs.readFileSync(
      path.join(process.cwd(), "supabase", "migrations", "20260909000004_rpc_functions.sql"),
      "utf-8",
    );

    // Consent check
    expect(rpcSql).toContain("(p_data->>'consent')::boolean IS NOT TRUE");
    expect(rpcSql).toContain("Customer consent is required and must be explicitly true");

    // Atomic single-statement rate limit upsert
    expect(rpcSql).toContain("INSERT INTO public.rate_limits");
    expect(rpcSql).toContain("ON CONFLICT (ip_hash) DO UPDATE");
    expect(rpcSql).toContain("REVOKE ALL ON FUNCTION public.check_rate_limit FROM PUBLIC, anon, authenticated;");

    // Authoritative order snapshots
    expect(rpcSql).toContain("v_req.request_type = 'gallery'");
    expect(rpcSql).toContain("v_authoritative_name");
    expect(rpcSql).toContain("v_authoritative_code");
    expect(rpcSql).toContain("REVOKE ALL ON FUNCTION public.convert_request_to_order FROM PUBLIC, anon;");
  });

  test("6. Admin API handlers enforce verifyActiveAdmin authorization", () => {
    const adminDesigns = fs.readFileSync(
      path.join(process.cwd(), "app", "api", "admin", "designs", "route.ts"),
      "utf-8",
    );
    expect(adminDesigns).toContain("verifyActiveAdmin()");

    const adminRequests = fs.readFileSync(
      path.join(process.cwd(), "app", "api", "admin", "requests", "route.ts"),
      "utf-8",
    );
    expect(adminRequests).toContain("verifyActiveAdmin()");

    const adminOrders = fs.readFileSync(
      path.join(process.cwd(), "app", "api", "admin", "orders", "route.ts"),
      "utf-8",
    );
    expect(adminOrders).toContain("verifyActiveAdmin()");
  });

  test("7. Public request endpoint strictly rejects missing, false, or malformed consent", () => {
    const createRoute = fs.readFileSync(
      path.join(process.cwd(), "app", "api", "requests", "create", "route.ts"),
      "utf-8",
    );

    expect(createRoute).toContain("rawConsent === null || !consent");
    expect(createRoute).toContain("Customer consent is required and must be explicitly true.");
    expect(createRoute).toContain(".remove([uploadedPath])");
    expect(createRoute).not.toContain("requestId: rpcRes.request_id");
  });

  test("8. Server-only secrets do not leak into client bundle definitions or NEXT_PUBLIC_ namespace", () => {
    const envExample = fs.readFileSync(
      path.join(process.cwd(), ".env.local.example"),
      "utf-8",
    );

    expect(envExample).toContain("SUPABASE_SECRET_KEY=");
    expect(envExample).toContain("RATE_LIMIT_HMAC_SECRET=");
    expect(envExample).not.toContain("NEXT_PUBLIC_SUPABASE_SECRET_KEY");

    const adminTs = fs.readFileSync(
      path.join(process.cwd(), "lib", "supabase", "admin.ts"),
      "utf-8",
    );

    expect(adminTs).toContain('import "server-only"');
  });
});
