import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const secretKey = process.env.SUPABASE_SECRET_KEY || "";

  if (!url || !secretKey) {
    throw new Error(
      "Supabase URL or Secret Key missing. Add SUPABASE_SECRET_KEY to .env.local for server-side operations.",
    );
  }

  return createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
