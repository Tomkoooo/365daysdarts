import type { Metadata } from "next";
import { PageContentService } from "@/services/page-content";
import { SeoSettingsService } from "@/services/seo-settings";
import { MARKETING_PAGE_SEEDS } from "@/lib/content/default-pages";

export async function buildPageMetadata(slug: string): Promise<Metadata> {
  const [globalSeo, page] = await Promise.all([
    SeoSettingsService.get(),
    PageContentService.getPublished(slug),
  ]);

  const seed = MARKETING_PAGE_SEEDS.find((s) => s.slug === slug);
  const title =
    page?.meta?.seoTitle ||
    page?.title ||
    seed?.title ||
    globalSeo.siteTitle;
  const description =
    page?.meta?.seoDescription || globalSeo.siteDescription;
  const ogImage = page?.meta?.ogImage || globalSeo.ogImage;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}
