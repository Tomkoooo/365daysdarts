import { redirect } from "next/navigation";
import { RolePreviewClient } from "@/components/admin/RolePreviewClient";

const VALID_ROLES = ["student", "lecturer", "business"] as const;

export default async function AdminPreviewPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;

  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    redirect("/admin");
  }

  return <RolePreviewClient role={role} />;
}
