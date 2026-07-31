import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { activeProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Current Projects",
  description:
    "The projects FXB Rwanda is running today, and the districts each one reaches.",
};

/**
 * Current Projects.
 *
 * The brief leaves this heading empty, but the Where We Work table gives every
 * running project and the districts it covers — so the page is built from that
 * rather than left as a stub. Same `projects.ts` as the map on Who We Are, so
 * ending a project updates both.
 *
 * What is still missing is a paragraph per project: what it does, who funds it,
 * when it runs. Those are fields on `Project` waiting to be filled, not text to
 * be written here.
 *
 * Not a hero route: it opens on white with the header already solid.
 */
export default function CurrentProjectsPage() {
  const districtCount = new Set(
    activeProjects.flatMap((project) => project.districts)
  ).size;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "What We Do", href: "/what-we-do" }]}
        eyebrow="CURRENT PROJECTS"
        title="What we are running today"
        intro={`${activeProjects.length} projects across ${districtCount} districts, delivered with government, donors and community partners.`}
      />

      <section className="bg-white pb-24 lg:pb-32">
        <Container>
          <ul className="flex flex-col">
            {activeProjects.map((project, index) => (
              <Reveal
                as="li"
                key={project.id}
                delay={Math.min(index, 3) * 60}
                className="border-t border-gray-15 last:border-b"
              >
                <div className="flex flex-col gap-5 py-9 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
                  <div className="flex flex-col gap-4 lg:max-w-[42ch]">
                    <h2 className="text-2xl font-bold tracking-[-0.02em] text-blue lg:text-[28px]">
                      {project.href ? (
                        <Link
                          href={project.href}
                          {...(project.href.startsWith("http")
                            ? { target: "_blank", rel: "noreferrer noopener" }
                            : {})}
                          className="group inline-flex items-start gap-2 transition-colors duration-200 hover:text-green"
                        >
                          {project.name}
                          <ArrowUpRight
                            className="mt-1 size-5 shrink-0 text-gray-80 transition-colors duration-200 group-hover:text-green"
                            aria-hidden="true"
                          />
                        </Link>
                      ) : (
                        project.name
                      )}
                    </h2>
                    {project.period && (
                      <p className="text-sm text-gray-80">{project.period}</p>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-3">
                    <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-gray-80">
                      <MapPin className="size-3.5" aria-hidden="true" />
                      {project.districts.length}{" "}
                      {project.districts.length === 1
                        ? "DISTRICT"
                        : "DISTRICTS"}
                    </p>
                    <ul className="flex flex-wrap gap-2">
                      {project.districts.map((district) => (
                        <li
                          key={district}
                          className="rounded-full bg-blue-08 px-4 py-1.5 text-sm font-medium text-blue"
                        >
                          {district}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={120} className="mt-14 flex flex-wrap gap-4">
            <Pill href="/who-we-are#where-we-work" variant="primary" size="lg">
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
