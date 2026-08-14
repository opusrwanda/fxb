import type { Metadata } from "next";
import { getSection } from "@/cms/content/sections";
import { Hero } from "@/components/sections/hero";
import { WhatWeDoNav } from "@/components/layout/what-we-do-nav";
import { PhotoBand } from "@/components/sections/photo-band";
import { getPhotos } from "@/cms/content/photos";
import { getPageHeaderImage } from "@/cms/content/page-headers";
import { Approach } from "@/components/sections/what-we-do/approach";
import { AreasOfIntervention } from "@/components/sections/what-we-do/areas-of-intervention";
import { ModelIntro } from "@/components/sections/what-we-do/model-intro";
import { ModelPillars } from "@/components/sections/what-we-do/model-pillars";
import { ModelPrinciples } from "@/components/sections/what-we-do/model-principles";
import { ProjectsDelivered } from "@/components/sections/what-we-do/projects-delivered";
import { TransformationJourney } from "@/components/sections/what-we-do/transformation-journey";
import { WhyItWorks } from "@/components/sections/what-we-do/why-it-works";
import { getCurrentProgrammes } from "@/cms/content/programmes";

export const metadata: Metadata = {
  title: "What We Do",
  description:
    "Integrated programmes across child protection, education, health, nutrition, economic empowerment, WASH and climate resilience — guided by the FXBVillage model, a 36-month route out of poverty.",
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
export default async function WhatWeDoPage() {
  const copy = await getSection("header:/what-we-do");
  // Three pictures for the top half of this page, which ran 4,260 pixels —
  // Our Approach through to the principles — without one.
  const photos = await getPhotos([
    "fostering-03.jpg",
    "fxbvillage-musambira-05.jpg",
    "fxbvillage-tlf-11.jpg",
    "fxbvillage-tlf-04.jpg",
  ]);
  const banner = await getPageHeaderImage("/what-we-do");
  const programmes = await getCurrentProgrammes();
  const journeyCopy = await getSection("what-we-do:journey");
  // Derived, not written down. The hero makes a claim about how much of this
  // organisation's work the page covers, and a hand-typed "6 programmes across
  // 13 districts" would be wrong the first time a project ends — the same two
  // figures the Current Projects page and the Who We Are map already compute
  // from the Programmes collection.
  const districtCount = new Set(
    programmes.flatMap((programme) => programme.districts)
  ).size;

  return (
    <>
      <Hero
        image={banner}
        headline={copy.heading ?? ""}
        // The old body read "The FXBVillage model works on income, health,
        // education…", which handed the whole page to one project. FXBVillage
        // is the model that guides the work and by some distance the largest
        // thing here — but five other programmes run alongside it, and the
        // brief's own wording is "Guided by the FXBVillage Model, we work
        // across multiple sectors", not "the FXBVillage model is the work".
        // The scope comes first now and the model is named as chief among the
        // programmes rather than as the sum of them.
        body={`So we never treat one at a time. Across ${districtCount} districts, our ${programmes.length} programmes work on income, health, education, nutrition, child protection, WASH and climate resilience together — the FXBVillage model chief among them.`}
        ctas={[
          { label: "The FXBVillage Model", href: "#fxbvillage-model", primary: true },
          // Was "Our Impact". A hero that has just claimed six programmes
          // should offer the list of them, and Our Impact is already reachable
          // from the nav and from the buttons further down this page.
          { label: "Current Projects", href: "/what-we-do/current-projects" },
        ]}
      />

      <WhatWeDoNav />

      <Approach image={photos["fxbvillage-tlf-04.jpg"]} />

      {/* The page opens with five sections of unbroken argument — the approach,
          the challenge, the model, the 36 months, the principles — and every
          photograph on it used to sit below them. These three are spaced
          through that run rather than grouped, so no stretch of it goes more
          than about a thousand pixels without the work appearing in it. */}
      {photos["fostering-03.jpg"] && (
        <PhotoBand image={photos["fostering-03.jpg"]}>
          Poverty arrives in every part of a life at once.
        </PhotoBand>
      )}

      <ModelIntro />

      {photos["fxbvillage-musambira-05.jpg"] && (
        <PhotoBand image={photos["fxbvillage-musambira-05.jpg"]}>
          Three years, and a household that no longer needs us.
        </PhotoBand>
      )}

      <TransformationJourney copy={journeyCopy} items={journeyCopy.items} />
      <ModelPrinciples />

      {photos["fxbvillage-tlf-11.jpg"] && (
        <PhotoBand image={photos["fxbvillage-tlf-11.jpg"]}>
          A business of one&apos;s own is what the last year is for.
        </PhotoBand>
      )}
      <ModelPillars />
      <WhyItWorks />
      <ProjectsDelivered />
      <AreasOfIntervention />
    </>
  );
}
