import { CreateDesign } from "@/components/admin/CreateDesign";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  return <CreateDesign key={edit || "new"} editId={edit} />;
}
