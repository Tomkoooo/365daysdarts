import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/session";
import { ensureMarketingPagesSeeded, getContentPagesAdmin } from "@/actions/content-actions";
import ContentCmsEditor from "@/components/dashboard/content/ContentCmsEditor";

export default async function ContentDashboardPage() {
  const session = await getAuthSession();
  if (session?.user?.role !== "admin") {
    redirect("/dashboard");
  }

  await ensureMarketingPagesSeeded();
  const pages = await getContentPagesAdmin();
  return <ContentCmsEditor initialPages={pages} />;
}
