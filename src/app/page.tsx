import { Hero } from "@/components/sections/hero";
import { ImpactStories } from "@/components/sections/impact-stories";
import { ImpactCounters } from "@/components/sections/impact-counters";
import { LatestNews } from "@/components/sections/latest-news";
import { NewsletterSignup } from "@/components/sections/newsletter-signup";
import { Partners } from "@/components/sections/partners";
import { WhatWeDo } from "@/components/sections/what-we-do";
import { WhoWeAre } from "@/components/sections/who-we-are";

/**
 * The three figures the hero rail carries.
 *
 * Chosen to be the shortest complete answer to "who are these people and does
 * this work" — scale, track record, and the one number that describes the
 * method. The 36 months is doing the most work of the three: it is the only
 * one a visitor cannot guess, and it is the question that gets them past the
 * fold.
 *
 * Reach and project count are stated as the content brief states them, and the
 * brief marks the reach figure "(Insert updated statistics from MEL/database)"
 * — see `lib/impact.ts`. Both want confirming before launch.
 */
const heroStats = [
  { figure: "2.9M+", label: "children and families reached since 2012" },
  { figure: "54", label: "FXBVillage projects delivered across Rwanda" },
  { figure: "36", label: "months from crisis to self-reliance" },
];

export default function Home() {
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
        stats={heroStats}
        scrollTo="#who-we-are"
      />

      <WhoWeAre />
      <WhatWeDo />
      <ImpactCounters />
      <ImpactStories />
      <Partners />
      <LatestNews />
      <NewsletterSignup />
    </>
  );
}
