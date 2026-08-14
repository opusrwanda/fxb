import type { IconId } from "@/components/brand/icon";

/**
 * Which icon each pillar is drawn with.
 *
 * Lifted out of `model-pillars.tsx` so the section registry can name it too —
 * the pillars are a default item list there now, and importing a section
 * component into the content layer to reach one constant would be the wrong
 * way round.
 *
 * The ids mostly match the pillar's own, and "health-and-wash" is the one that
 * does not: the icon set calls it the other way about.
 */
export const PILLAR_ICONS: Record<string, IconId> = {
  "home-visits-and-coaching": "home-visits-and-coaching",
  "economic-empowerment": "economic-empowerment",
  "nutrition-and-food-security": "nutrition-and-food-security",
  "education-and-access-to-information": "education-and-access-to-information",
  "health-and-wash": "wash-and-health",
};
