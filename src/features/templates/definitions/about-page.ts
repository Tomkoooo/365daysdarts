import type { TemplateDefinition } from "@/features/templates/types";

export const aboutPageTemplate: TemplateDefinition = {
  id: "about-page",
  name: "Bemutatkozó oldal",
  description: "Szöveg és csapat grid",
  thumbnail: "/logo.svg",
  theme: {
    cta: "#00aaff",
    navy: "#031947",
  },
  defaultBlocks: [
    {
      type: "richText",
      payload: {
        title: "Rólunk",
        html: "<p>Írd ide a szervezet bemutatkozását. Használhatsz <strong>formázott</strong> szöveget is.</p>",
      },
    },
    {
      type: "peopleGrid",
      payload: {
        title: "Csapatunk",
        description: "Ismerd meg a csapat tagjait.",
        columns: "3",
        people: [
          {
            name: "Név",
            role: "Szerepkör",
            bio: "Rövid bemutatkozás.",
            imageUrl: "",
            buttonLabel: "",
            buttonHref: "",
          },
        ],
      },
    },
  ],
};
