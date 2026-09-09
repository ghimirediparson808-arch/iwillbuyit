import { notFound } from "next/navigation";
import { AdminSections } from "@/components/admin/AdminSections";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ q?: string; preview?: string }>;
}) {
  const { section } = await params;
  const { q = "", preview = "" } = await searchParams;
  if (
    ![
      "designs",
      "customers",
      "inventory",
      "analytics",
      "settings",
      "search",
    ].includes(section)
  )
    notFound();
  return (
    <AdminSections
      key={section + q + preview}
      section={section}
      initialQuery={q}
      previewId={preview}
    />
  );
}
