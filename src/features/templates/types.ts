import type { ContentBlockType } from "@/lib/content/types";

export type TemplateBlockDefinition = {
  type: ContentBlockType;
  payload: Record<string, unknown>;
};

export type TemplateDefinition = {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  defaultBlocks: TemplateBlockDefinition[];
  theme: Partial<Record<string, string>>;
};
