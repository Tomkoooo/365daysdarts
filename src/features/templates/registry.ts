import type { TemplateDefinition } from "@/features/templates/types";
import { landingPageTemplate } from "@/features/templates/definitions/landing-page";
import { aboutPageTemplate } from "@/features/templates/definitions/about-page";
import { eventPageTemplate } from "@/features/templates/definitions/event-page";
import { coursePageTemplate } from "@/features/templates/definitions/course-page";

function newBlockId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const TEMPLATES: TemplateDefinition[] = [
  landingPageTemplate,
  aboutPageTemplate,
  eventPageTemplate,
  coursePageTemplate,
];

export function listTemplates(): TemplateDefinition[] {
  return TEMPLATES;
}

export function getTemplateById(id: string): TemplateDefinition | null {
  return TEMPLATES.find((template) => template.id === id) ?? null;
}

export function buildBlocksFromTemplate(template: TemplateDefinition) {
  return template.defaultBlocks.map((block, index) => ({
    blockId: newBlockId(),
    type: block.type,
    order: index,
    payload: block.payload,
  }));
}
