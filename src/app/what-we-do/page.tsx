import type { Metadata } from "next";
import { Hero } from "@/components/sections/hero";
import { Approach } from "@/components/sections/what-we-do/approach";
import { AreasOfIntervention } from "@/components/sections/what-we-do/areas-of-intervention";
import { ModelIntro } from "@/components/sections/what-we-do/model-intro";
import { ModelPillars } from "@/components/sections/what-we-do/model-pillars";
import { ModelPrinciples } from "@/components/sections/what-we-do/model-principles";
import { ProjectsDelivered } from "@/components/sections/what-we-do/projects-delivered";
import { TransformationJourney } from "@/components/sections/what-we-do/transformation-journey";
import { WhyItWorks } from "@/components/sections/what-we-do/why-it-works";

export const metadata: Metadata = {
  title: "What We Do",
  description:
    "The FXBVillage model: a 36-month, holistic route out of poverty delivered across child protection, education, health, nutrition, economic empowerment, WASH and climate resilience.",
};

/**
 * What We Do.
 *
 * The rooms alternate white and blue the whole way down — approach, challenge,
 * model, journey, principles, pillars, why it works, the count, the areas — so
 * a long page still reads as a sequence of distinct rooms rather than one
 * continuous scroll.
 *
 * Anchors: `#fxbvillage-model` and `#areas` are linked from the header menu,
 * and `#socio-economic-strengthening`, `#ecd-education`, `#health` and
 * `#herbal-medicine` from the home page's four pillars. The area anchors are
 * rendered on the individual cards in `AreasOfIntervention`.
 *
 * This route is in `TRANSPARENT_HEADER_ROUTES`, so it must open with `<Hero>` —
 * see the note in `site.ts`.
 */
export default function WhatWeDoPage() {
  return (
    <>
      <Hero
        headline="Families never face one problem at a time."
        body="So we never treat one at a time. The FXBVillage model works on income, health, education, nutrition, protection and shelter together — over 36 months, until a household no longer needs us."
        ctas={[
          { label: "The FXBVillage Model", href: "#fxbvillage-model", primary: true },
          { label: "Our Impact", href: "/our-impact" },
        ]}
      />

      <Approach />
      <ModelIntro />
      <TransformationJourney />
      <ModelPrinciples />
      <ModelPillars />
      <WhyItWorks />
      <ProjectsDelivered />
      <AreasOfIntervention />
    </>
  );
}
