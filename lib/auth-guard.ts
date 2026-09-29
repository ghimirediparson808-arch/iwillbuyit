import { createClient } from "@/lib/supabase/server";

export async function verifyActiveAdmin(): Promise<{
  authorized: boolean;
  userId?: string;
  displayName?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return { authorized: false, error: "Unauthenticated" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("admin_profiles")
      .select("id, display_name, role, is_active")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin" || !profile.is_active) {
      return { authorized: false, error: "Unauthorized: Active admin profile required" };
    }

    return {
      authorized: true,
      userId: profile.id,
      displayName: profile.display_name,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication failed";
    return { authorized: false, error: message };
  }
}
