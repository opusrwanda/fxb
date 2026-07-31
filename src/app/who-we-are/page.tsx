import type { Metadata } from "next";
import { Hero } from "@/components/sections/hero";
import { Leadership } from "@/components/sections/leadership";
import { OurStory } from "@/components/sections/our-story";
import { VisionMission } from "@/components/sections/vision-mission";
import { WhereWeWork } from "@/components/sections/where-we-work";

export const metadata: Metadata = {
  title: "Who We Are",
  description:
    "FXB Rwanda is a registered Rwandan NGO and a member of FXB Global, working across all four provinces and the City of Kigali since 1995.",
};

/**
 * Who We Are.
 *
 * Section order follows the brief, and the anchors match the ones the header
 * menu links to — #story, #vision, #where-we-work, #leadership. The rooms
 * alternate white, blue, white, white by the site's rhythm; the map section
 * stays on white because it is the densest thing on the page and a colour
 * ground underneath it would fight the districts for attention.
 *
 * This route is listed in `TRANSPARENT_HEADER_ROUTES`, so it must open with a
 * `<Hero>` — see the note in `site.ts`.
 */
export default function WhoWeArePage() {
  return (
    <>
      <Hero
        headline="A local NGO, rooted here since 1995."
        body="FXB Rwanda is a registered Rwandan NGO and a member of FXB Global, carrying the legacy of François-Xavier Bagnoud into its fourth decade — across all four provinces and the City of Kigali."
        ctas={[
          { label: "Explore Our Work", href: "/what-we-do", primary: true },
          { label: "Our Impact", href: "/our-impact" },
        ]}
      />

      <OurStory />
      <VisionMission />
      <WhereWeWork />
      <Leadership />
    </>
  );
}
