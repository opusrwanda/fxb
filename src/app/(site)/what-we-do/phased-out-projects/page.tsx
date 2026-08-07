import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
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

      <section className="bg-white pb-24 lg:pb-32">
        <Container>
          {phasedOut.length > 0 ? (
            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
              {phasedOut.map((project, index) => (
                <Reveal as="li" key={project.slug} delay={60 + Math.min(index, 3) * 60}>
                  {project.image && (
                    <div className="wedge relative aspect-4/3 overflow-hidden">
                      <Image
                        src={project.image.url}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <h2 className="mt-6 text-xl font-bold tracking-[-0.02em] text-blue lg:text-2xl">
                    {project.name}
                  </h2>
                  {project.runs && (
                    <p className="mt-1.5 text-sm text-gray-80">
                      {project.runs}
                    </p>
                  )}
                  <p className="mt-3 text-[15px] leading-snug text-gray">
                    {project.districts.join(", ")}
                  </p>
                </Reveal>
              ))}
            </ul>
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
