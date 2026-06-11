import RenderMarketingPage from "@/components/content/RenderMarketingPage";
import { buildPageMetadata } from "@/lib/content/page-metadata";

export async function generateMetadata() {
  return buildPageMetadata("home");
}

export default async function HomePage() {
  return <RenderMarketingPage slug="home" />;
}
