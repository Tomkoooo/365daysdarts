import { notFound } from "next/navigation";
import RenderMarketingPage from "@/components/content/RenderMarketingPage";
import { buildPageMetadata } from "@/lib/content/page-metadata";
import { PageContentService } from "@/services/page-content";
import { MARKETING_PAGE_SEEDS } from "@/lib/content/default-pages";

const RESERVED = new Set([
  "admin",
  "api",
  "dashboard",
  "lecturer",
  "courses",
  "login",
  "register",
  "error",
  "exams",
]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const pathSlug = slug.join("/");
  return buildPageMetadata(pathSlug);
}

export default async function DynamicCmsPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;

  if (slug.some((segment) => RESERVED.has(segment))) {
    notFound();
  }

  const pathSlug = slug.join("/");
  const published = await PageContentService.getPublished(pathSlug);
  const hasSeed = MARKETING_PAGE_SEEDS.some((s) => s.slug === pathSlug);

  if (!published && !hasSeed) {
    notFound();
  }

  return <RenderMarketingPage slug={pathSlug} />;
}
