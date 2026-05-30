import connectDB from "@/lib/db";
import ContentPage from "@/models/ContentPage";
import {
  validateBlockPayload,
  type ContentBlockType,
} from "@/lib/content/types";
import { sanitizeHtml } from "@/lib/content/sanitize";
import { MARKETING_PAGE_SEEDS } from "@/lib/content/default-pages";

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function normalizePayload(type: ContentBlockType, payload: unknown) {
  const parsed = validateBlockPayload(type, payload) as Record<string, unknown>;
  if (type === "richText" && typeof parsed.html === "string") {
    return { ...parsed, html: sanitizeHtml(parsed.html) };
  }
  return parsed;
}

function normalizeBlocksOrder(blocks: any[]) {
  return blocks
    .sort((a, b) => a.order - b.order)
    .map((block, index) => ({ ...block, order: index }));
}

export type PageContentMeta = {
  hasDraft: boolean;
  publishedAt?: Date;
  status: "draft" | "published";
};

export type PublishedPage = {
  slug: string;
  title: string;
  blocks: any[];
  meta?: {
    seoTitle?: string;
    seoDescription?: string;
    ogImage?: string;
  };
  publishedAt?: Date;
};

/**
 * PageContentService — draft/publish read contract inspired by tWeb.
 * Backed by the existing ContentPage Mongoose model.
 */
export class PageContentService {
  static async getPublished(slug: string): Promise<PublishedPage | null> {
    await connectDB();
    const page = await ContentPage.findOne({ slug: slug.trim().toLowerCase() }).lean();
    if (!page || page.status !== "published") return null;

    return serialize({
      slug: page.slug,
      title: page.title,
      blocks: normalizeBlocksOrder([...(page.publishedBlocks || [])]),
      meta: page.meta || {},
      publishedAt: page.publishedAt,
    });
  }

  static async getDraft(slug: string) {
    await connectDB();
    const page = await ContentPage.findOne({ slug: slug.trim().toLowerCase() }).lean();
    if (!page) {
      const seed = MARKETING_PAGE_SEEDS.find((s) => s.slug === slug);
      if (seed) {
        return serialize({
          slug: seed.slug,
          title: seed.title,
          blocks: seed.blocks,
          meta: {},
          status: "draft" as const,
        });
      }
      return null;
    }

    return serialize({
      slug: page.slug,
      title: page.title,
      blocks: normalizeBlocksOrder([...(page.draftBlocks || [])]),
      meta: page.meta || {},
      status: page.status,
      publishedBlocks: normalizeBlocksOrder([...(page.publishedBlocks || [])]),
    });
  }

  static async getMeta(slug: string): Promise<PageContentMeta> {
    await connectDB();
    const page = await ContentPage.findOne({ slug: slug.trim().toLowerCase() }).lean();
    if (!page) return { hasDraft: false, status: "draft" };
    const hasDraft =
      JSON.stringify(page.draftBlocks || []) !==
      JSON.stringify(page.publishedBlocks || []);
    return {
      hasDraft,
      publishedAt: page.publishedAt,
      status: page.status,
    };
  }

  static slugToPath(slug: string): string {
    return slug === "home" ? "/" : `/${slug}`;
  }

  static normalizeBlocksForSave(blocks: any[]) {
    return normalizeBlocksOrder(
      blocks.map((block) => ({
        ...block,
        payload: normalizePayload(block.type as ContentBlockType, block.payload),
      }))
    );
  }
}
