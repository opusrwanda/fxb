import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { getCurrentProgrammes } from "@/cms/content/programmes";

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
 * rather than left as a stub. Same Programmes collection as the map on Who We
 * Are, so phasing a project out updates both.
 *
 * What is still missing is a paragraph per project: what it does, who funds it,
 * when it runs. Those are fields on the collection waiting to be filled in from
 * `/staff`, not text to be written here.
 *
 * Not a hero route: it opens on white with the header already solid.
 */
export default async function CurrentProjectsPage() {
  const projects = await getCurrentProgrammes();
  const districtCount = new Set(
    projects.flatMap((project) => project.districts)
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

      <section className="bg-white pb-24 lg:pb-32">
        <Container>
          <ul className="flex flex-col">
            {projects.map((project, index) => (
              <Reveal
                as="li"
                key={project.slug}
                delay={Math.min(index, 3) * 60}
                className="border-t border-gray-15 last:border-b"
              >
                <div className="flex flex-col gap-5 py-9 lg:flex-row lg:items-start lg:gap-10">
                  {/* The programme's own photograph, which the CMS has held all
                      along and this page never asked for. A listing of names
                      and district chips is a table; the same rows with the work
                      in them are a page about projects. */}
                  {project.image && (
                    <div className="aspect-4/3 w-full shrink-0 overflow-hidden rounded-card lg:aspect-square lg:w-44">
                      <Image
                        src={project.image.url}
                        alt={project.image.alt}
                        width={project.image.width}
                        height={project.image.height}
                        sizes="(min-width: 1024px) 176px, 100vw"
                        className="size-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-4 lg:max-w-[38ch] lg:flex-1">
                    <h2 className="text-2xl font-bold tracking-[-0.02em] text-blue lg:text-[28px]">
                      {project.href ? (
                        <Link
                          href={project.href}
                          {...(project.href.startsWith("http")
                            ? { target: "_blank", rel: "noreferrer noopener" }
                            : {})}
                          className="group inline-flex items-start gap-2 transition-colors duration-300 hover:text-green"
                        >
                          {project.name}
                          <ArrowUpRight
                            className="mt-1 size-5 shrink-0 text-gray-80 transition-colors duration-300 group-hover:text-green"
                            aria-hidden="true"
                          />
                        </Link>
                      ) : (
                        project.name
                      )}
                    </h2>
                    {project.runs && (
                      <p className="text-sm text-gray-80">{project.runs}</p>
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
