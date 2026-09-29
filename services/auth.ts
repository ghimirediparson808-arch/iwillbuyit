import { createClient } from "@/lib/supabase/client";

const sessionKey = "iwbi-demo-session";
const isProd = process.env.NODE_ENV === "production";

export const demoAuth = {
  email: "admin@iwillbuyit.com",
  password: "PrintWithPurpose",
  signedIn() {
    if (typeof window === "undefined") return false;
    const supabaseKey = Object.keys(localStorage).find(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token"),
    );
    if (supabaseKey) return true;

    // Local session check permitted only in non-production
    if (!isProd) {
      return (
        localStorage.getItem(sessionKey) === "demo" ||
        sessionStorage.getItem(sessionKey) === "demo"
      );
    }
    return false;
  },
  async signIn(email: string, password: string, remember: boolean) {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      throw new Error("Enter an admin email and password.");
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        if (!isProd && trimmedEmail.toLowerCase() === this.email && password === this.password) {
          (remember ? localStorage : sessionStorage).setItem(sessionKey, "demo");
          return;
        }
        throw new Error(error.message || "Invalid admin login credentials.");
      }

      if (data.session) {
        (remember ? localStorage : sessionStorage).setItem(sessionKey, "demo");
      }
    } catch (err: unknown) {
      if (!isProd && trimmedEmail.toLowerCase() === this.email && password === this.password) {
        (remember ? localStorage : sessionStorage).setItem(sessionKey, "demo");
        return;
      }
      throw err;
    }
  },
  async signOut() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(sessionKey);
      sessionStorage.removeItem(sessionKey);
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // Ignore offline logout exceptions
      }
    }
  },
};
