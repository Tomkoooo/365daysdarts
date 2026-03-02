import { CONTENT_BLOCK_TYPES, ContentBlockType, validateBlockPayload } from "@/lib/content/types";

type SmokeResult = {
  ok: boolean;
  warnings: string[];
};

function hasHeadingOrList(html: string) {
  return /<h[1-6]\b/i.test(html) || /<(ul|ol)\b/i.test(html);
}

export function runContentSmokeChecks(blocks: { type: ContentBlockType; payload: unknown }[]): SmokeResult {
  const warnings: string[] = [];

  for (const [index, block] of blocks.entries()) {
    if (!CONTENT_BLOCK_TYPES.includes(block.type)) {
      throw new Error(`Unsupported block type at index ${index}: ${block.type}`);
    }

    const payload = validateBlockPayload(block.type, block.payload) as Record<string, unknown>;

    if (block.type === "media" && !payload.url) {
      throw new Error(`Media block at index ${index} is missing url`);
    }

    if (
      block.type === "accordion" &&
      (!Array.isArray(payload.items) || payload.items.length === 0)
    ) {
      throw new Error(`Accordion block at index ${index} needs at least one item`);
    }

    if (block.type === "richText") {
      const html = typeof payload.html === "string" ? payload.html : "";
      if (!hasHeadingOrList(html)) {
        warnings.push(
          `Rich text block at index ${index} does not include heading/list tags. This is allowed but review content quality.`
        );
      }
    }
  }

  return { ok: true, warnings };
}
