import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  MapPin,
} from "lucide-react";

import { formatDate } from "@/cms/content/date";
import { getOpening, getOpenings, hasClosed } from "@/cms/content/opportunities";
import { formatBytes } from "@/cms/content/publications";
import { ApplicationForm } from "@/components/layout/application-form";
import { Container } from "@/components/layout/container";
import { Prose } from "@/components/layout/prose";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";

export async function generateStaticParams() {
  const openings = await getOpenings("career");
  return openings.map((opening) => ({ slug: opening.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const opening = await getOpening(slug);
  if (!opening) return { title: "Not found" };

  return {
    title: opening.title,
    description:
      opening.summary ??
      `A career opportunity at FXB Rwanda. Applications close ${formatDate(opening.closesAt)}.`,
  };
}

/**
 * One vacancy, in full, with the form to apply for it.
 *
 * This page is the thing the Careers listing was missing. Every opening was
 * printed on the listing with its whole description, which made the list
 * unreadable and left applying to whatever email address a candidate could
 * find elsewhere on the site.
 *
 * The layout follows the articles rather than the section landings, and for
 * the same reason: this is a document somebody reads, not a place on the site.
 * White ground, one centred column, no banner photograph — a job description
 * does not have a picture and a generic one would be decoration over somebody
 * deciding whether to change jobs. `hasTransparentHeader` keeps the bar solid
 * here for the same reason it does on an article.
 *
 * A closed vacancy still renders. Somebody arriving from an email the week
 * after it closed is told that it closed, on the page for the post they were
 * looking for — a 404 would say the position never existed.
 */
export default async function VacancyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const opening = await getOpening(slug);

  // A procurement notice has its own page and its own listing; reaching one
  // through the careers URL would put a tender under a "Join our team" trail.
  if (!opening || opening.kind !== "career") notFound();

  const closed = hasClosed(opening);

  return (
    <article className="bg-white pt-[calc(4rem+3.5rem)] pb-24 lg:pt-[calc(4.5rem+5rem)] lg:pb-32">
      <Container>
        {/* The header runs the full measure above both columns, so the trail,
            the title and the facts about the post read as one block rather
            than as the top of the left-hand one. */}
        <div>
          <Reveal className="flex flex-col gap-6">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-80">
                {[
                  { label: "Get Involved", href: "/get-involved" },
                  { label: "Careers", href: "/get-involved/careers" },
                ].map((crumb, index, all) => (
                  <li key={crumb.href} className="flex items-center gap-1.5">
                    <Link
                      href={crumb.href}
                      className="transition-colors duration-300 hover:text-blue"
                    >
                      {crumb.label}
                    </Link>
                    {index < all.length - 1 && (
                      <ChevronRight className="size-3.5" aria-hidden="true" />
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            <div className="flex items-center gap-4">
              <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
              <span className="text-xs font-semibold tracking-[0.18em] text-gray-80">
                {closed ? "CLOSED" : "VACANCY"}
              </span>
            </div>

            <h1 className="max-w-[24ch] text-3xl leading-[1.12] font-bold tracking-[-0.03em] text-balance text-blue sm:text-[38px] lg:text-[52px]">
              {opening.title}
            </h1>

            {/* The facts a candidate checks before reading a word of the
                description: what it is, where it is, and whether they still
                have time. */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[15px] text-gray">
              {opening.employment && (
                <span className="rounded-full bg-blue-08 px-3 py-1 text-xs font-semibold tracking-wide text-blue uppercase">
                  {opening.employment}
                </span>
              )}
              {opening.location && (
                <span className="flex items-center gap-2">
                  <MapPin className="size-4 text-gray-80" aria-hidden="true" />
                  {opening.location}
                </span>
              )}
              <span className="flex items-center gap-2">
                <Clock className="size-4 text-gray-80" aria-hidden="true" />
                {closed
                  ? `Closed ${formatDate(opening.closesAt)}`
                  : `Applications close ${formatDate(opening.closesAt)}`}
              </span>
            </div>
          </Reveal>

          <div className="mt-10 h-px w-full bg-gray-15" aria-hidden="true" />

          {/* Two columns from `lg`: the description reads on the left, the form
              stays in view on the right.

              8/4 of twelve, which lands at 781/363 inside the 1200 measure —
              the ratio asked for, and it falls out of the grid rather than
              being two hand-set percentages that stop adding up the first time
              the gap changes. Below `lg` they stack, description first: a form
              above the thing it is a form for asks somebody to apply for a job
              they have not read. */}
          <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-8">
              {opening.summary && (
                <Reveal delay={110}>
                  <p className="max-w-[46ch] text-2xl leading-[1.4] font-medium text-blue lg:text-[28px]">
                    {opening.summary}
                  </p>
                </Reveal>
              )}

              {opening.body && (
                <Reveal delay={180} className={opening.summary ? "mt-10" : ""}>
                  <Prose data={opening.body} />
                </Reveal>
              )}

              {/* The two documents are different errands and are labelled
                  as such: the pack is read, the form is filled in and sent
                  back. A vacancy can have one, the other, both or neither. */}
              {(opening.document || opening.form) && (
                <Reveal delay={240} className="mt-10 flex flex-wrap gap-4">
                  {opening.document && (
                    <Pill
                      href={opening.document.url}
                      variant="outline"
                      size="lg"
                      newTab
                    >
                      <ExternalLink className="mr-2 size-4" aria-hidden="true" />
                      Read the full pack
                      {opening.document.bytes
                        ? ` (${formatBytes(opening.document.bytes)})`
                        : ""}
                    </Pill>
                  )}

                  {opening.form && (
                    <Pill
                      href={opening.form.url}
                      variant="primary"
                      size="lg"
                      newTab
                    >
                      <Download className="mr-2 size-4" aria-hidden="true" />
                      Download the application form
                      {opening.form.bytes
                        ? ` (${formatBytes(opening.form.bytes)})`
                        : ""}
                    </Pill>
                  )}
                </Reveal>
              )}

              <Reveal delay={300} className="mt-14 border-t border-gray-15 pt-10">
                <Link
                  href="/get-involved/careers"
                  className="inline-flex items-center gap-2 text-base font-semibold text-blue transition-colors duration-300 hover:text-green"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  All positions
                </Link>
              </Reveal>
            </div>

            <aside className="lg:col-span-4">
              {/* `top-28` clears the pinned bar plus a little air, and that is
                  the whole of it — no height cap.

                  A cap with `overflow-y-auto` was the first attempt, on the
                  reasoning that a panel taller than the viewport would pin
                  with its Submit button permanently off-screen. It solved a
                  problem that does not exist and caused one that does: the
                  card was cut off mid-field at the cap, with no visible
                  scrollbar to say why.

                  Sticky releases at the bottom of its containing block, and
                  the containing block here is a grid cell that grows to fit
                  this card. So a panel too tall to pin fully simply travels up
                  as the section ends, bringing its lower half — and the button
                  — into view. Nothing is unreachable. */}
              <div className="lg:sticky lg:top-28">
                <div className="wedge bg-blue-08 p-6 lg:p-7">
                  <h2
                    id="apply"
                    className="scroll-mt-28 text-xl font-bold tracking-[-0.02em] text-blue lg:text-2xl"
                  >
                    {closed ? "Applications have closed" : "Apply for this position"}
                  </h2>

                  {closed ? (
                    <p className="mt-3 text-[15px] leading-relaxed text-gray">
                      This position closed on {formatDate(opening.closesAt)} and
                      is no longer accepting applications. New openings are
                      posted on the careers page whenever they arise.
                    </p>
                  ) : (
                    <>
                      <p className="mt-3 text-[15px] leading-relaxed text-gray">
                        Closes {formatDate(opening.closesAt)}. We read every
                        application and reply to those we would like to take
                        further.
                      </p>
                      <div className="mt-6">
                        <ApplicationForm
                          opportunityId={opening.id}
                          title={opening.title}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </Container>
    </article>
  );
}
