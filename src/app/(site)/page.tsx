import { getStories } from "@/cms/content/stories";
import { Hero } from "@/components/sections/hero";
import { ImpactStories } from "@/components/sections/impact-stories";
import { ImpactCounters } from "@/components/sections/impact-counters";
import { LatestNews } from "@/components/sections/latest-news";
import { Partners } from "@/components/sections/partners";
import { WhatWeDo } from "@/components/sections/what-we-do";
import { WhoWeAre } from "@/components/sections/who-we-are";

/**
 * The home page opens on footage and a headline, and nothing else.
 *
 * The hero used to carry a rail of three figures at the fold — reach, projects
 * delivered, and the 36-month length of the model. They are gone by request.
 * The figures still stand where they are the point rather than the garnish:
 * the impact band below, and Our Impact in full. The hairline and the scroll
 * cue stay, so the room still ends on an invitation rather than on an edge.
 */
export default async function Home() {
  const stories = await getStories();

  return (
    <>
      <Hero
        withVideo
        // Not "FXB RWANDA" — the lockup two inches above it already says that,
        // and an eyebrow that repeats the logo spends a line to add nothing.
        // This one answers the question a first-time visitor actually arrives
        // with, which is whether this is a Rwandan organisation or a foreign
        // one operating here.
        eyebrow="A RWANDAN NGO SINCE 1995"
        headline="Creating a world fit for children."
        body="FXB Rwanda empowers vulnerable children, families and communities through integrated interventions in education, health, nutrition, economic empowerment, child protection, HIV prevention, WASH and climate resilience."
        ctas={[
          { label: "Explore Our Work", href: "/what-we-do", primary: true },
          { label: "Our Impact", href: "/our-impact" },
        ]}
        scrollTo="#who-we-are"
      />

      <WhoWeAre />
      <WhatWeDo />
      <ImpactCounters />
      <ImpactStories stories={stories} />
      <Partners />
      <LatestNews />
      {/* No signup section here. The footer below carries the real form on
          every page now, so a full band above it was asking the same question
          twice within one screen of itself. The section still stands on the
          newsletters page, where signing up is what the page is for. */}
    </>
  );
}
