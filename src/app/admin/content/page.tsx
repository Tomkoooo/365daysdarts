import { ensureMarketingPagesSeeded, getContentPagesAdmin } from "@/actions/content-actions";
import { AdminShell } from "@/components/admin/AdminShell";
import ContentCmsEditor from "@/components/dashboard/content/ContentCmsEditor";

export default async function AdminContentPage() {
  await ensureMarketingPagesSeeded();
  const pages = await getContentPagesAdmin();

  return (
    <AdminShell title="Content">
      <ContentCmsEditor initialPages={pages} />
    </AdminShell>
  );
}
