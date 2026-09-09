import { Suspense } from "react";
import { Requests } from "@/components/admin/Requests";
export default function Page() {
  return (
    <Suspense fallback={<p>Loading requests…</p>}>
      <Requests />
    </Suspense>
  );
}
