import { AdminShell } from "@/components/admin/AdminShell";
import { Suspense } from "react";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <main id="main" className="empty-state" role="status">
          Opening your workspace…
        </main>
      }
    >
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
