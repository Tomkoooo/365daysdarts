import { z } from "zod";

export const CONTENT_BLOCK_TYPES = [
  "hero",
  "richText",
  "accordion",
  "media",
  "cta",
  "featureCards",
  "buttonRow",
  "peopleGrid",
] as const;

export type ContentBlockType = (typeof CONTENT_BLOCK_TYPES)[number];

export const BLOCK_TYPE_LABELS: Record<ContentBlockType, string> = {
  hero: "Hős szekció",
  richText: "Szöveg",
  accordion: "Accordion",
  media: "Média",
  cta: "Felhívás",
  featureCards: "Kártyák",
  buttonRow: "Gombok",
  peopleGrid: "Személyek",
};

const ctaLinkSchema = z.object({
  label: z.string().trim().min(1, "Button label is required"),
  href: z.string().trim().min(1, "Button URL is required"),
});

const heroSchema = z.object({
  badge: z.string().trim().max(80).default(""),
  title: z.string().trim().min(1, "Hero title is required"),
  highlight: z.string().trim().max(120).default(""),
  description: z.string().trim().max(2500).default(""),
  links: z.array(ctaLinkSchema).max(3).default([]),
});

const richTextSchema = z.object({
  title: z.string().trim().max(160).default(""),
  html: z.string().trim().default("<p></p>"),
});

const accordionItemSchema = z.object({
  title: z.string().trim().min(1, "Accordion item title is required"),
  content: z.string().trim().min(1, "Accordion item content is required"),
  mediaType: z.enum(["image", "video"]).optional(),
  mediaUrl: z.string().trim().max(500).default(""),
  mediaAlt: z.string().trim().max(180).default(""),
});

const accordionSchema = z.object({
  title: z.string().trim().max(160).default(""),
  items: z.array(accordionItemSchema).min(1, "Add at least one accordion item"),
});

const mediaSchema = z.object({
  title: z.string().trim().max(160).default(""),
  mediaType: z.enum(["image", "video"]),
  url: z.string().trim().min(1, "Media URL is required"),
  alt: z.string().trim().max(180).default(""),
  caption: z.string().trim().max(400).default(""),
});

const ctaSchema = z.object({
  title: z.string().trim().min(1, "CTA title is required"),
  description: z.string().trim().max(800).default(""),
  buttonLabel: z.string().trim().min(1, "CTA button label is required"),
  buttonHref: z.string().trim().min(1, "CTA button URL is required"),
});

const featureCardSchema = z.object({
  title: z.string().trim().min(1, "Card title is required"),
  description: z.string().trim().min(1, "Card description is required"),
  buttonLabel: z.string().trim().max(80).default(""),
  buttonHref: z.string().trim().max(300).default(""),
});

const featureCardsSchema = z.object({
  title: z.string().trim().max(160).default(""),
  description: z.string().trim().max(500).default(""),
  cards: z.array(featureCardSchema).min(1, "Add at least one feature card").max(6),
});

const buttonRowSchema = z.object({
  title: z.string().trim().max(160).default(""),
  buttons: z.array(ctaLinkSchema).min(1, "Add at least one button").max(6),
});

const personSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  role: z.string().trim().max(120).default(""),
  bio: z.string().trim().max(3000).default(""),
  imageUrl: z.string().trim().max(500).default(""),
  buttonLabel: z.string().trim().max(80).default(""),
  buttonHref: z.string().trim().max(300).default(""),
});

const peopleGridSchema = z.object({
  title: z.string().trim().max(160).default(""),
  description: z.string().trim().max(500).default(""),
  columns: z.enum(["2", "3"]).default("3"),
  people: z.array(personSchema).min(1, "Add at least one person").max(24),
});

export const blockPayloadSchemas: Record<ContentBlockType, z.ZodSchema> = {
  hero: heroSchema,
  richText: richTextSchema,
  accordion: accordionSchema,
  media: mediaSchema,
  cta: ctaSchema,
  featureCards: featureCardsSchema,
  buttonRow: buttonRowSchema,
  peopleGrid: peopleGridSchema,
};

export function getDefaultPayload(type: ContentBlockType) {
  switch (type) {
    case "hero":
      return {
        badge: "",
        title: "New Hero Title",
        highlight: "",
        description: "",
        links: [],
      };
    case "richText":
      return {
        title: "",
        html: "<p>Start writing...</p>",
      };
    case "accordion":
      return {
        title: "Frequently Asked Questions",
        items: [
          {
            title: "New question",
            content: "Answer...",
            mediaType: "image",
            mediaUrl: "",
            mediaAlt: "",
          },
        ],
      };
    case "media":
      return {
        title: "",
        mediaType: "image",
        url: "",
        alt: "",
        caption: "",
      };
    case "cta":
      return {
        title: "Ready to start?",
        description: "",
        buttonLabel: "Learn more",
        buttonHref: "/",
      };
    case "featureCards":
      return {
        title: "Feature section",
        description: "",
        cards: [{ title: "Feature", description: "Feature description" }],
      };
    case "buttonRow":
      return {
        title: "",
        buttons: [{ label: "Learn more", href: "/" }],
      };
    case "peopleGrid":
      return {
        title: "Team",
        description: "",
        columns: "3",
        people: [
          {
            name: "Person Name",
            role: "Role",
            bio: "Bio",
            imageUrl: "",
            buttonLabel: "",
            buttonHref: "",
          },
        ],
      };
    default:
      return {};
  }
}

export function validateBlockPayload(type: ContentBlockType, payload: unknown) {
  const schema = blockPayloadSchemas[type];
  return schema.parse(payload);
}
