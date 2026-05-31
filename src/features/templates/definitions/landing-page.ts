import type { TemplateDefinition } from "@/features/templates/types";

export const landingPageTemplate: TemplateDefinition = {
  id: "landing-page",
  name: "Landing oldal",
  description: "Hero, funkció kártyák és felhívás szekció",
  thumbnail: "/logo.svg",
  theme: {
    cta: "#00aaff",
    navy: "#031947",
  },
  defaultBlocks: [
    {
      type: "hero",
      payload: {
        badge: "Új",
        title: "Üdvözöljük",
        highlight: "oldalunkon",
        description: "Rövid bemutatkozó szöveg a landing oldalhoz.",
        links: [
          { label: "Kezdés", href: "/", icon: "arrow-right" },
          { label: "Tudj meg többet", href: "/rolunk", icon: "info" },
        ],
      },
    },
    {
      type: "featureCards",
      payload: {
        title: "Miért minket válassz?",
        description: "Három fő előny röviden.",
        cards: [
          { title: "Szakértelem", description: "Tapasztalt csapat.", icon: "award" },
          { title: "Rugalmasság", description: "Az igényeidhez igazítva.", icon: "calendar" },
          { title: "Közösség", description: "Aktív tagok.", icon: "users" },
        ],
      },
    },
    {
      type: "cta",
      payload: {
        title: "Készen állsz?",
        description: "Lépj kapcsolatba velünk még ma.",
        buttonLabel: "Kapcsolat",
        buttonHref: "/kapcsolat",
      },
    },
  ],
};
