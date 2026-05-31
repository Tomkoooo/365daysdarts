import type { TemplateDefinition } from "@/features/templates/types";

export const coursePageTemplate: TemplateDefinition = {
  id: "course-page",
  name: "Kurzus oldal",
  description: "Hero, funkció kártyák és űrlap",
  thumbnail: "/logo.svg",
  theme: {
    cta: "#00aaff",
    navy: "#031947",
  },
  defaultBlocks: [
    {
      type: "hero",
      payload: {
        badge: "Kurzus",
        title: "Kurzus neve",
        highlight: "",
        description: "Mit tanulhatsz ezen a kurzuson?",
        links: [{ label: "Jelentkezés", href: "#form", icon: "graduation-cap" }],
      },
    },
    {
      type: "featureCards",
      payload: {
        title: "Mit kapsz?",
        description: "A kurzus fő elemei.",
        cards: [
          { title: "Videók", description: "Strukturált tananyag.", icon: "video" },
          { title: "Gyakorlat", description: "Gyakorlati feladatok.", icon: "target" },
          { title: "Támogatás", description: "Instruktor segítség.", icon: "message-circle" },
        ],
      },
    },
    {
      type: "form",
      payload: {
        title: "Jelentkezés",
        description: "Töltsd ki az űrlapot a jelentkezéshez.",
        submitLabel: "Küldés",
        successMessage: "Köszönjük a jelentkezést!",
        actionUrl: "",
        fields: [
          { name: "name", label: "Név", type: "text", required: true, placeholder: "Teljes név" },
          { name: "email", label: "Email", type: "email", required: true, placeholder: "email@example.com" },
        ],
      },
    },
  ],
};
