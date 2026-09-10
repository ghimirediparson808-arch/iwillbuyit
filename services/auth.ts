import { createClient } from "@/lib/supabase/client";

const key = "iwbi-demo-session";

export const demoAuth = {
  email: "admin@iwillbuyit.com",
  password: "PrintWithPurpose",
  signedIn() {
    if (typeof window === "undefined") return false;
    const local =
      localStorage.getItem(key) === "demo" ||
      sessionStorage.getItem(key) === "demo";
    if (local) return true;
    const supabaseKey = Object.keys(localStorage).find(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token"),
    );
    return !!supabaseKey;
  },
  async signIn(email: string, password: string, remember: boolean) {
    if (!email.trim() || !password) {
      throw new Error("Enter an admin email and password.");
    }
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        if (
          email.trim().toLowerCase() === this.email &&
          password === this.password
        ) {
          (remember ? localStorage : sessionStorage).setItem(key, "demo");
          return;
        }
        throw new Error(error.message || "Invalid login credentials.");
      }
      if (data.session) {
        (remember ? localStorage : sessionStorage).setItem(key, "demo");
      }
    } catch (err: unknown) {
      if (
        email.trim().toLowerCase() === this.email &&
        password === this.password
      ) {
        (remember ? localStorage : sessionStorage).setItem(key, "demo");
        return;
      }
      throw err;
    }
  },
  async signOut() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // ignore offline logout errors
      }
    }
  },
};
