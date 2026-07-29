import { Hero } from "@/components/sections/hero";
import { ImpactStories } from "@/components/sections/impact-stories";
import { ImpactCounters } from "@/components/sections/impact-counters";
import { LatestNews } from "@/components/sections/latest-news";
import { Partners } from "@/components/sections/partners";
import { WhatWeDo } from "@/components/sections/what-we-do";
import { WhoWeAre } from "@/components/sections/who-we-are";

export default function Home() {
  return (
    <>
      <Hero
        withVideo
        headline="Creating a world fit for children."
        body="FXB Rwanda empowers vulnerable children, families and communities through integrated interventions in education, health, nutrition, economic empowerment, child protection, HIV prevention, WASH and climate resilience."
        ctas={[
          { label: "Explore Our Work", href: "/what-we-do", primary: true },
          { label: "Our Impact", href: "/our-impact" },
        ]}
      />

      <WhoWeAre />
      <WhatWeDo />
      <ImpactCounters />
      <ImpactStories />
      <Partners />
      <LatestNews />
    </>
  );
}
