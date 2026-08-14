import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { getProgramme, getProgrammes } from "@/cms/content/programmes";
import { isEmpty } from "@/cms/content/richtext";
import { getSiteDetails } from "@/cms/content/settings";
import { Prose } from "@/components/layout/prose";

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
 * The moment `summary` and `body` are filled in on the programme in `/staff`,
 * the empty state disappears and the copy takes its place. No code changes.
 *
 * Not a hero route: it opens on white with the header already solid.
 */
export async function generateStaticParams() {
  const programmes = await getProgrammes();
  return programmes.map((programme) => ({ slug: programme.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProgramme(slug);
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
  const [project, details] = await Promise.all([
    getProgramme(slug),
    getSiteDetails(),
  ]);

  // A programme that has been unpublished should 404 rather than render an
  // empty shell, so a stale link fails loudly.
  if (!project) notFound();

  const external = project.href?.startsWith("http");

  /**
   * Read defensively, because a cached programme may predate these fields.
   *
   * `getProgramme` defaults each of them, and that is not enough: the reader is
   * wrapped in `unstable_cache`, whose entries live in `.next/cache` and
   * survive a build. So the first deploy after a field is added replays
   * objects serialised by the previous one — the mapper never runs, and
   * `project.objectives` arrives `undefined` rather than `[]`. It took the
   * production build down with "Cannot read properties of undefined" on a page
   * that had built cleanly here, because the local `.next` had been cleared.
   *
   * Deleting `.next/cache` on deploy fixes the instance; this fixes the class.
   */
  const objectives = project.objectives ?? [];
  const results = project.results ?? [];
  const components = project.components ?? [];

  /**
   * Is there anything to read?
   *
   * Any one of the four written blocks counts. It used to test the summary and
   * the body alone, so a programme whose objectives and results had been filled
   * in but whose long description had not would have shown the "being prepared"
   * panel with the objectives sitting nowhere.
   */
  const written =
    Boolean(project.summary) ||
    !isEmpty(project.body) ||
    objectives.length > 0 ||
    results.length > 0 ||
    components.length > 0;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "What We Do", href: "/what-we-do" },
          {
            label: project.current ? "Current Projects" : "Phased-out Projects",
            href: project.current
              ? "/what-we-do/current-projects"
              : "/what-we-do/phased-out-projects",
          },
        ]}
        eyebrow={project.current ? "CURRENT PROGRAMME" : "PHASED-OUT PROGRAMME"}
        title={project.name}
        intro={`Running in ${project.districts.length} ${
          project.districts.length === 1 ? "district" : "districts"
        }: ${project.districts.join(", ")}.`}
      />

      <section className="bg-white pb-24 lg:pb-32">
        <Container className="flex flex-col gap-12 lg:gap-16">
          {project.image && (
            <Reveal>
              <div className="wedge relative aspect-16/9 overflow-hidden bg-blue-08">
                <Image
                  src={project.image.url}
                  alt={project.image.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 75vw, 100vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          )}

          <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-16">
            <Reveal className="lg:col-span-7">
              {written ? (
                /**
                 * One order, every programme.
                 *
                 * Summary, then what it set out to do, then the account of it,
                 * then what it achieved, then what it delivers. A reader who
                 * has read one programme page knows where to look on the next,
                 * and two can be compared without hunting for the same fact
                 * under a different heading — which is what happens when the
                 * whole thing is one rich-text field and each programme
                 * invents its own structure.
                 *
                 * Every block below disappears when it is empty. A programme
                 * too early to have results shows no Results heading rather
                 * than an empty one, and nothing here is a placeholder waiting
                 * to be filled — an empty heading is a promise the page cannot
                 * keep.
                 */
                <div className="flex flex-col gap-10">
                  {project.summary && (
                    <p className="text-2xl leading-[1.4] font-medium text-blue lg:text-[28px]">
                      {project.summary}
                    </p>
                  )}

                  {objectives.length > 0 && (
                    <div>
                      <h2 className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                        OBJECTIVES
                      </h2>
                      <ul className="mt-5 flex flex-col gap-3">
                        {objectives.map((item) => (
                          <li
                            key={item}
                            className="flex gap-3 text-base leading-relaxed text-gray lg:text-[17px]"
                          >
                            <span
                              className="mt-2.5 size-1.5 shrink-0 rounded-full bg-green"
                              aria-hidden="true"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!isEmpty(project.body) && (
                    <div>
                      {/* The heading appears only where something else is on
                          the page to distinguish it from. On a programme with
                          nothing but a description, "ABOUT THIS PROGRAMME"
                          over the only block on the page is a label on a box
                          with one thing in it. */}
                      {(objectives.length > 0 ||
                        results.length > 0) && (
                        <h2 className="mb-5 text-xs font-semibold tracking-[0.14em] text-gray-80">
                          ABOUT THIS PROGRAMME
                        </h2>
                      )}
                      <Prose data={project.body} />
                    </div>
                  )}

                  {results.length > 0 && (
                    <div className="wedge bg-green-10 p-8">
                      <h2 className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                        RESULTS
                      </h2>
                      <ul className="mt-5 flex flex-col gap-4">
                        {results.map((item) => (
                          <li
                            key={item}
                            className="flex gap-3 text-base leading-relaxed text-blue lg:text-[17px]"
                          >
                            <span
                              className="mt-2.5 size-1.5 shrink-0 rounded-full bg-green"
                              aria-hidden="true"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {components.length > 0 && (
                    <div>
                      <h2 className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                        WHAT IT DELIVERS
                      </h2>
                      <ul className="mt-6 grid gap-x-10 sm:grid-cols-2">
                        {components.map((item) => (
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
                      href: `mailto:${details.email}?subject=${encodeURIComponent(project.name)}`,
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

            <Reveal delay={140} className="lg:col-span-4 lg:col-start-9">
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
                    className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
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
            delay={290}
            className="flex flex-wrap gap-4 border-t border-gray-15 pt-12"
          >
            <Pill
              href={
                project.current
                  ? "/what-we-do/current-projects"
                  : "/what-we-do/phased-out-projects"
              }
              variant="outline"
              size="lg"
            >
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

/**
 * A programme published between deploys still resolves.
 *
 * This used to be `dynamicParams = false`, which was right when the six
 * programmes were a checked-in array and any other slug was a typo. Now the
 * collection is edited from `/staff`: a seventh programme published on a
 * Tuesday would have 404'd until the next build, and `getProgramme` already
 * calls `notFound()` for a slug that genuinely does not exist.
 */
export const dynamicParams = true;
