import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { WhatWeDoNav } from "@/components/layout/what-we-do-nav";
import { ProgrammeListing } from "@/components/sections/what-we-do/programme-listing";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { getProgrammeGroups } from "@/cms/content/programmes";

export const metadata: Metadata = {
  title: "Current Projects",
  description:
    "The projects FXB Rwanda is running today, and the districts each one reaches.",
};

/**
 * Current Projects.
 *
 * THE ONE LISTING OF THE PROGRAMMES. There used to be two — this page, and a
 * section headed "OUR PROGRAMMES" a few thousand pixels down `/what-we-do` —
 * built from the same table in two different shapes. The one on the page
 * actually called Current Projects was the poorer: a row of name, photograph
 * and district chips where only the name was a link, and only on the two
 * programmes carrying an external URL, so four of six went nowhere at all.
 *
 * The section has moved here and the row has gone. `/what-we-do` is the model;
 * this is the work. Same Programmes collection as the map on Who We Are, so
 * phasing a project out updates both.
 *
 * Not a hero route: it opens on white with the header already solid.
 */
export default async function CurrentProjectsPage() {
  // Grouped, so the FXBVillage projects sit under the model rather than beside
  // it. `getProgrammeGroups` promotes a child whose parent has phased out, so
  // nothing disappears from this page when a parent ends.
  const groups = await getProgrammeGroups();
  const projects = groups.flatMap((group) => [group, ...group.children]);
  const districtCount = new Set(
    projects.flatMap((project) => project.districts),
  ).size;

  return (
    <>
      <PageHeader
        path="/what-we-do/current-projects"
        breadcrumbs={[{ label: "What We Do", href: "/what-we-do" }]}
        eyebrow="CURRENT PROJECTS"
        title="What we are running today"
        intro={`${projects.length} projects across ${districtCount} districts, delivered with government, donors and community partners.`}
      />

      <WhatWeDoNav />

      <section className="bg-white pt-14 pb-24 lg:pt-16 lg:pb-32">
        <Container>
          <ProgrammeListing groups={groups} />

          {/* The model comes first of the three.
              Every project on this page is delivered through the FXBVillage
              model, and the section explaining it is the one thing a reader is
              most likely to want back — the breadcrumb only reaches the top of
              What We Do, which leaves them to find the section themselves on a
              page with seven of them. */}
          <Reveal delay={220} className="mt-14 flex flex-wrap gap-4">
            <Pill
              href="/what-we-do#fxbvillage-model"
              variant="primary"
              size="lg"
            >
              The FXBVillage Model
            </Pill>
            <Pill href="/who-we-are#where-we-work" size="lg">
              See these on the map
            </Pill>
            <Pill href="/what-we-do/phased-out-projects" size="lg">
              Phased-out Projects
            </Pill>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
