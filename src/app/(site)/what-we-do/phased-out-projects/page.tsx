import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { WhatWeDoNav } from "@/components/layout/what-we-do-nav";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { ProgrammeListing } from "@/components/sections/what-we-do/programme-listing";
import { getReach } from "@/cms/content/impact";
import { getPhasedOutProgrammes } from "@/cms/content/programmes";
import { getSiteDetails } from "@/cms/content/settings";

export const metadata: Metadata = {
  title: "Phased-out Projects",
  description:
    "Projects FXB Rwanda has completed, and the districts and periods they covered.",
};

/**
 * Phased-out Projects.
 *
 * The brief gives this page a heading, a note that it should show "photo with
 * title of the project and the period of implementation", and no projects. The
 * grid below is built to that spec and renders the moment a programme in
 * `/staff` is set to "Phased out".
 *
 * Until then the page states the one thing that is actually known — 54
 * FXBVillage projects delivered — rather than showing an empty grid under a
 * heading. It is a real page with real content, not a stub.
 */
export default async function PhasedOutProjectsPage() {
  const [phasedOut, reach, details] = await Promise.all([
    getPhasedOutProgrammes(),
    getReach(),
    getSiteDetails(),
  ]);

  return (
    <>
      <PageHeader
        path="/what-we-do/phased-out-projects"
        breadcrumbs={[{ label: "What We Do", href: "/what-we-do" }]}
        eyebrow="PHASED-OUT PROJECTS"
        title="Work that has run its course"
        intro="A project ending is the point of the model. Families exit when they no longer need us — with income, savings, school fees paid and health cover in place."
      />

      <WhatWeDoNav />

      <section className="bg-white pt-14 pb-24 lg:pt-16 lg:pb-32">
        <Container>
          {phasedOut.length > 0 ? (
            // The same cards the current projects have, so a finished
            // project opens to its own page too. These were a picture, a name
            // and a line of districts with nothing to click — the page behind
            // each one existed and nothing led to it.
            <ProgrammeListing
              groups={phasedOut.map((project) => ({ ...project, children: [] }))}
              showPeriod
            />
          ) : (
            <Reveal className="wedge flex flex-col items-start gap-7 bg-blue-08 p-9 lg:p-14">
              {/* No date on the count: the brief says 54 have been implemented
                  and separately that the model arrived in 2000, but it never
                  ties the two together, and "since 2000" would be our
                  inference presented as FXB's figure. */}
              <p className="max-w-[52ch] text-2xl leading-[1.35] font-medium text-blue lg:text-[28px]">
                {reach.projectsDelivered} FXBVillage projects have been delivered,
                leaving thousands of families resilient from poverty.
              </p>
              <p className="max-w-[58ch] text-base leading-relaxed text-gray lg:text-[17px]">
                We are preparing the full record of completed projects for
                publication here, with the districts and period each one
                covered. In the meantime, our current work is listed in full,
                and the team is glad to answer questions about earlier
                programmes.
              </p>
              <div className="flex flex-wrap gap-4">
                <Pill
                  href="/what-we-do/current-projects"
                  variant="primary"
                  size="lg"
                >
                  Current Projects
                </Pill>
                <Pill href={`mailto:${details.email}`} size="lg">
                  Ask about past projects
                </Pill>
              </div>
            </Reveal>
          )}
        </Container>
      </section>
    </>
  );
}
