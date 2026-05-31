import type { TemplateDefinition } from "@/features/templates/types";

export const eventPageTemplate: TemplateDefinition = {
  id: "event-page",
  name: "Esemény oldal",
  description: "Hero, accordion GYIK és felhívás",
  thumbnail: "/logo.svg",
  theme: {
    cta: "#00aaff",
    navy: "#031947",
  },
  defaultBlocks: [
    {
      type: "hero",
      payload: {
        badge: "Esemény",
        title: "Esemény neve",
        highlight: "2026",
        description: "Esemény rövid leírása.",
        links: [{ label: "Jelentkezés", href: "/", icon: "ticket" }],
      },
    },
    {
      type: "accordion",
      payload: {
        title: "Gyakori kérdések",
        items: [
          { title: "Mikor van az esemény?", content: "Add meg a dátumot.", mediaType: "image", mediaUrl: "", mediaAlt: "" },
          { title: "Hol lesz?", content: "Add meg a helyszínt.", mediaType: "image", mediaUrl: "", mediaAlt: "" },
        ],
      },
    },
    {
      type: "cta",
      payload: {
        title: "Ne maradj le!",
        description: "Regisztrálj most az eseményre.",
        buttonLabel: "Regisztráció",
        buttonHref: "/",
      },
    },
  ],
};
