import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { photo } from "@/lib/photos";
import { projectBySlug, projects } from "@/lib/projects";
import { org } from "@/lib/site";

/**
 * One programme.
 *
 * Every programme now has somewhere to go. Until this existed the cards linked
 * either nowhere or, in FXBVillage's case, to an anchor on the page they were
 * already on — five of the six were dead ends, and the only route to any detail
 * was a listing page that held the same name and districts again.
 *
 * What it can show today is thin, and deliberately looks it: the brief's Where
 * We Work table gives project names and the districts they run in and nothing
 * else. So the page renders what exists — the photograph, the districts, the
 * programme's own system where it has one — and then says plainly that the
 * description is being prepared, rather than padding itself out with paragraphs
 * written on FXB's behalf.
 *
 * The moment `summary` and `body` are filled in on `projects.ts`, the empty
 * state disappears and the copy takes its place. No component changes.
 *
 * Not a hero route: it opens on white with the header already solid.
 */
export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projectBySlug(slug);
  if (!project) return {};

  return {
    title: project.name,
    description:
      project.summary ??
      `${project.name} — an FXB Rwanda programme running in ${project.districts.join(", ")}.`,
  };
}

export default async function ProgrammePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projectBySlug(slug);

  // A programme that has been removed from the data should 404 rather than
  // render an empty shell, so a stale link fails loudly.
  if (!project) notFound();

  const external = project.href?.startsWith("http");

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "What We Do", href: "/what-we-do" },
          { label: "Programmes", href: "/what-we-do#programmes" },
        ]}
        eyebrow={project.active ? "CURRENT PROGRAMME" : "PHASED-OUT PROGRAMME"}
        title={project.name}
        intro={`Running in ${project.districts.length} ${
          project.districts.length === 1 ? "district" : "districts"
        }: ${project.districts.join(", ")}.`}
      />

      <section className="bg-white pb-24 lg:pb-32">
        <Container className="flex flex-col gap-12 lg:gap-16">
          {project.photo && (
            <Reveal>
              <div className="wedge relative aspect-16/9 overflow-hidden bg-blue-08">
                <Image
                  src={photo(project.photo).url}
                  alt={project.photoAlt ?? ""}
                  fill
                  priority
                  sizes="(min-width: 1024px) 75vw, 100vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          )}

          {project.draft && (
            <Reveal>
              {/* Draft copy renders the real design and says so. Without this
                  the only thing distinguishing placeholder text from FXB's own
                  words would be a comment in a file nobody reading the page can
                  see. Clearing `draft` on the programme removes it. */}
              <p className="wedge border border-gray-15 bg-blue-08 px-6 py-4 text-[15px] leading-relaxed text-gray">
                <strong className="font-semibold text-blue">
                  Draft description.
                </strong>{" "}
                This account of {project.name} is a working draft prepared for
                layout review and has not been confirmed by FXB Rwanda. Figures
                and dates are illustrative.
              </p>
            </Reveal>
          )}

          <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-16">
            <Reveal className="lg:col-span-7">
              {project.summary || project.body ? (
                <div className="flex flex-col gap-6">
                  {project.summary && (
                    <p className="text-2xl leading-[1.4] font-medium text-blue lg:text-[28px]">
                      {project.summary}
                    </p>
                  )}
                  {project.body?.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 40)}
                      className="max-w-[62ch] text-base leading-relaxed text-gray lg:text-[17px]"
                    >
                      {paragraph}
                    </p>
                  ))}

                  {project.components && project.components.length > 0 && (
                    <div className="mt-6">
                      <h2 className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                        WHAT IT DELIVERS
                      </h2>
                      <ul className="mt-6 grid gap-x-10 sm:grid-cols-2">
                        {project.components.map((item) => (
                          <li
                            key={item}
                            className="border-t border-gray-15 py-4 text-base font-medium text-blue"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                // The honest version, for a programme with no copy yet. Same
                // panel Careers and Publications use, so "being prepared" reads
                // the same way everywhere rather than as a broken page.
                <EmptyState
                  title="A fuller description is on its way"
                  body={`We are preparing a full account of ${project.name} — what it does, who it reaches, who funds it and over what period. In the meantime the districts it runs in are listed here, and the team can tell you more directly.`}
                  actions={[
                    {
                      label: "Ask about this programme",
                      href: `mailto:${org.email}?subject=${encodeURIComponent(project.name)}`,
                      primary: true,
                    },
                    {
                      label: "Where we work",
                      href: "/who-we-are#where-we-work",
                    },
                  ]}
                />
              )}
            </Reveal>

            <Reveal delay={80} className="lg:col-span-4 lg:col-start-9">
              {/* The facts rail. Every row is optional and simply absent when
                  the data has nothing for it, so a programme with a funder but
                  no period does not render an empty label. */}
              <dl className="flex flex-col">
                {project.runs && (
                  <div className="flex flex-col gap-1 border-t border-gray-15 py-5">
                    <dt className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                      RUNS
                    </dt>
                    <dd className="text-base font-medium text-blue">
                      {project.runs}
                    </dd>
                  </div>
                )}
                {project.funder && (
                  <div className="flex flex-col gap-1 border-t border-gray-15 py-5">
                    <dt className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                      FUNDED BY
                    </dt>
                    <dd className="text-base font-medium text-blue">
                      {project.funder}
                    </dd>
                  </div>
                )}
                <div className="flex flex-col gap-1 border-t border-b border-gray-15 py-5">
                  <dt className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                    DISTRICTS
                  </dt>
                  <dd className="mt-2 flex flex-col gap-2.5">
                    {project.districts.map((district) => (
                      <span
                        key={district}
                        className="flex items-center gap-2.5 text-base font-medium text-blue"
                      >
                        <MapPin
                          className="size-4 shrink-0"
                          aria-hidden="true"
                        />
                        {district}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>

              {project.href && (
                <a
                  href={project.href}
                  {...(external
                    ? { target: "_blank", rel: "noreferrer noopener" }
                    : {})}
                  className="group mt-8 inline-flex items-center gap-2 text-base font-semibold text-blue"
                >
                  Visit the programme system
                  <ArrowUpRight
                    className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                  {external && (
                    <span className="sr-only">(opens in a new tab)</span>
                  )}
                </a>
              )}
            </Reveal>
          </div>

          <Reveal
            delay={160}
            className="flex flex-wrap gap-4 border-t border-gray-15 pt-12"
          >
            <Pill href="/what-we-do#programmes" variant="outline" size="lg">
              All programmes
            </Pill>
            <Pill href="/get-involved/partners#become-a-partner" size="lg">
              Partner with us
            </Pill>
          </Reveal>
        </Container>
      </section>
    </>
  );
}

/** Unlisted slugs 404 rather than rendering at request time. */
export const dynamicParams = false;
