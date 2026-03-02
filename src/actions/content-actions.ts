"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import { getAuthSession } from "@/lib/session";
import ContentPage from "@/models/ContentPage";
import {
  CONTENT_BLOCK_TYPES,
  ContentBlockType,
  getDefaultPayload,
  validateBlockPayload,
} from "@/lib/content/types";
import { sanitizeHtml } from "@/lib/content/sanitize";
import { defaultHomeDraftBlocks } from "@/lib/content/default-home";
import { runContentSmokeChecks } from "@/lib/content/smoke";
import { MARKETING_PAGE_SEEDS } from "@/lib/content/default-pages";

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

async function requireAdmin() {
  const session = await getAuthSession();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session.user.id;
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

export async function getPublishedContentPage(slug: string) {
  await connectDB();
  const page = await ContentPage.findOne({ slug }).lean();
  if (!page || page.status !== "published") {
    return null;
  }

  return serialize({
    slug: page.slug,
    title: page.title,
    blocks: (page.publishedBlocks || []).sort(
      (a: any, b: any) => a.order - b.order
    ),
    publishedAt: page.publishedAt,
  });
}

export async function getContentPagesAdmin() {
  await requireAdmin();
  await connectDB();

  const pages = await ContentPage.find({})
    .select("slug title status updatedAt publishedAt")
    .sort({ updatedAt: -1 })
    .lean();

  return serialize(pages);
}

export async function getContentPageAdmin(slug: string) {
  await requireAdmin();
  await connectDB();

  const page = await ContentPage.findOne({ slug }).lean();
  if (!page) return null;

  return serialize({
    ...page,
    draftBlocks: normalizeBlocksOrder([...(page.draftBlocks || [])]),
    publishedBlocks: normalizeBlocksOrder([...(page.publishedBlocks || [])]),
  });
}

export async function upsertContentPage(input: { slug: string; title: string }) {
  const userId = await requireAdmin();
  await connectDB();

  const slug = input.slug.trim().toLowerCase();
  const title = input.title.trim();
  if (!slug || !title) {
    throw new Error("Slug and title are required");
  }

  const existing = await ContentPage.findOne({ slug });
  if (existing) {
    existing.title = title;
    existing.updatedBy = userId;
    await existing.save();
  } else {
    await ContentPage.create({
      slug,
      title,
      updatedBy: userId,
      status: "draft",
      draftBlocks: [],
      publishedBlocks: [],
    });
  }

  revalidatePath("/dashboard/content");
  return { success: true };
}

export async function updateContentPageTitle(slug: string, title: string) {
  const userId = await requireAdmin();
  await connectDB();

  const normalizedSlug = slug.trim().toLowerCase();
  const normalizedTitle = title.trim();
  if (!normalizedSlug || !normalizedTitle) {
    throw new Error("Slug and title are required");
  }

  const page = await ContentPage.findOne({ slug: normalizedSlug });
  if (!page) {
    throw new Error("Content page not found");
  }

  page.title = normalizedTitle;
  page.updatedBy = userId;
  await page.save();

  revalidatePath("/dashboard/content");
  return { success: true };
}

export async function ensureHomePageSeeded() {
  const userId = await requireAdmin();
  await connectDB();

  const existing = await ContentPage.findOne({ slug: "home" });
  if (existing) return { success: true, created: false };

  await ContentPage.create({
    slug: "home",
    title: "Homepage",
    status: "draft",
    draftBlocks: defaultHomeDraftBlocks,
    publishedBlocks: [],
    updatedBy: userId,
  });

  revalidatePath("/dashboard/content");
  return { success: true, created: true };
}

export async function ensureMarketingPagesSeeded() {
  const userId = await requireAdmin();
  await connectDB();

  let createdCount = 0;
  for (const seed of MARKETING_PAGE_SEEDS) {
    const existing = await ContentPage.findOne({ slug: seed.slug });
    if (existing) continue;

    await ContentPage.create({
      slug: seed.slug,
      title: seed.title,
      status: "draft",
      draftBlocks: seed.blocks,
      publishedBlocks: [],
      updatedBy: userId,
    });
    createdCount += 1;
  }

  return { success: true, createdCount };
}

export async function restoreMarketingPagesDefaults() {
  const userId = await requireAdmin();
  await connectDB();

  let restoredCount = 0;
  for (const seed of MARKETING_PAGE_SEEDS) {
    await ContentPage.findOneAndUpdate(
      { slug: seed.slug },
      {
        $set: {
          title: seed.title,
          status: "published",
          draftBlocks: serialize(seed.blocks),
          publishedBlocks: serialize(seed.blocks),
          publishedAt: new Date(),
          updatedBy: userId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    restoredCount += 1;

    const publicPath = seed.slug === "home" ? "/" : `/${seed.slug}`;
    revalidatePath(publicPath);
  }

  revalidatePath("/dashboard/content");
  return { success: true, restoredCount };
}

export async function addContentBlock(slug: string, type: ContentBlockType) {
  const userId = await requireAdmin();
  await connectDB();

  if (!CONTENT_BLOCK_TYPES.includes(type)) {
    throw new Error("Invalid block type");
  }

  const page = await ContentPage.findOne({ slug });
  if (!page) throw new Error("Content page not found");

  const nextOrder = page.draftBlocks.length;
  const payload = normalizePayload(type, getDefaultPayload(type));
  page.draftBlocks.push({
    blockId: randomUUID(),
    type,
    order: nextOrder,
    payload,
  });
  page.updatedBy = userId;
  page.markModified("draftBlocks");
  await page.save();

  revalidatePath("/dashboard/content");
  return { success: true };
}

export async function updateContentBlock(
  slug: string,
  blockId: string,
  payload: unknown
) {
  const userId = await requireAdmin();
  await connectDB();

  const page = await ContentPage.findOne({ slug });
  if (!page) throw new Error("Content page not found");

  const block = page.draftBlocks.find((item: any) => item.blockId === blockId);
  if (!block) throw new Error("Block not found");

  block.payload = normalizePayload(block.type as ContentBlockType, payload);
  page.updatedBy = userId;
  page.markModified("draftBlocks");
  await page.save();

  revalidatePath("/dashboard/content");
  return { success: true };
}

export async function deleteContentBlock(slug: string, blockId: string) {
  const userId = await requireAdmin();
  await connectDB();

  const page = await ContentPage.findOne({ slug });
  if (!page) throw new Error("Content page not found");

  page.draftBlocks = page.draftBlocks.filter((item: any) => item.blockId !== blockId);
  page.draftBlocks = normalizeBlocksOrder(page.draftBlocks);
  page.updatedBy = userId;
  page.markModified("draftBlocks");
  await page.save();

  revalidatePath("/dashboard/content");
  return { success: true };
}

export async function reorderContentBlocks(slug: string, orderedIds: string[]) {
  const userId = await requireAdmin();
  await connectDB();

  const page = await ContentPage.findOne({ slug });
  if (!page) throw new Error("Content page not found");

  const byId = new Map(page.draftBlocks.map((block: any) => [block.blockId, block]));
  const reordered: any[] = [];

  for (const id of orderedIds) {
    const found = byId.get(id);
    if (found) reordered.push(found);
  }

  for (const block of page.draftBlocks) {
    if (!orderedIds.includes(block.blockId)) {
      reordered.push(block);
    }
  }

  page.draftBlocks = reordered.map((block, index) => ({ ...block, order: index }));
  page.updatedBy = userId;
  page.markModified("draftBlocks");
  await page.save();

  revalidatePath("/dashboard/content");
  return { success: true };
}

export async function publishContentPage(slug: string) {
  const userId = await requireAdmin();
  await connectDB();

  const page = await ContentPage.findOne({ slug });
  if (!page) throw new Error("Content page not found");

  const nextPublishedBlocks = normalizeBlocksOrder(
    page.draftBlocks.map((block: any) => ({
      blockId: block.blockId,
      type: block.type,
      order: block.order,
      payload: normalizePayload(block.type, block.payload),
    }))
  );
  runContentSmokeChecks(nextPublishedBlocks);
  page.publishedBlocks = nextPublishedBlocks;
  page.status = "published";
  page.publishedAt = new Date();
  page.updatedBy = userId;
  page.markModified("publishedBlocks");
  await page.save();

  if (slug === "home") {
    revalidatePath("/");
  }
  revalidatePath("/dashboard/content");
  return { success: true };
}

export async function runContentPageSmokeTests(slug: string) {
  await requireAdmin();
  await connectDB();

  const page = await ContentPage.findOne({ slug }).lean();
  if (!page) throw new Error("Content page not found");

  const result = runContentSmokeChecks((page.draftBlocks || []) as any[]);
  return { success: true, warnings: result.warnings };
}

export async function unpublishContentPage(slug: string) {
  const userId = await requireAdmin();
  await connectDB();

  const page = await ContentPage.findOne({ slug });
  if (!page) throw new Error("Content page not found");

  page.status = "draft";
  page.updatedBy = userId;
  await page.save();

  if (slug === "home") {
    revalidatePath("/");
  }
  revalidatePath("/dashboard/content");
  return { success: true };
}
