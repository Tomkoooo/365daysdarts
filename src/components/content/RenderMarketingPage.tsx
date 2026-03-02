import { getPublishedContentPage } from "@/actions/content-actions";
import { MARKETING_PAGE_SEEDS } from "@/lib/content/default-pages";
import { MarketingBlockRenderer } from "@/components/content/MarketingBlockRenderer";

export default async function RenderMarketingPage({ slug }: { slug: string }) {
  const page = await getPublishedContentPage(slug);
  if (page?.blocks?.length) {
    return <MarketingBlockRenderer blocks={page.blocks} />;
  }

  const fallback = MARKETING_PAGE_SEEDS.find((seed) => seed.slug === slug);
  return <MarketingBlockRenderer blocks={fallback?.blocks || []} />;
}
