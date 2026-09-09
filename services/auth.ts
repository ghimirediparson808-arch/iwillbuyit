const key = "iwbi-demo-session";
export const demoAuth = {
  email: "admin@iwillbuyit.com",
  password: "PrintWithPurpose",
  signedIn() {
    return (
      typeof window !== "undefined" &&
      (localStorage.getItem(key) === "demo" ||
        sessionStorage.getItem(key) === "demo")
    );
  },
  signIn(email: string, password: string, remember: boolean) {
    if (email.trim().toLowerCase() !== this.email || password !== this.password)
      throw new Error(
        "Email or password is incorrect. Use the demo credentials shown below.",
      );
    (remember ? localStorage : sessionStorage).setItem(key, "demo");
  },
  signOut() {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};
