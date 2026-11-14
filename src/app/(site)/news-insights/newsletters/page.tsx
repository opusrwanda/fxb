import type { Metadata } from "next";
import { getSection } from "@/cms/content/sections";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink, Mail } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { SubNav, newsInsightsNav } from "@/components/layout/sub-nav";
import { NewsletterSignup } from "@/components/sections/newsletter-signup";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";
import {
  formatBytes,
  formatPublicationDate,
  getPublicationsIn,
} from "@/cms/content/publications";
import { getEmailNewsletters } from "@/cms/content/email-newsletters";
import { formatDate } from "@/cms/content/date";

export const metadata: Metadata = {
  title: "Newsletters",
  description:
    "FXB Rwanda's quarterly newsletter — the districts, the programmes and the people, four times a year.",
};

/**
 * Newsletters.
 *
 * Two things were wrong here, and the smaller one was the empty archive.
 *
 * The larger one: this is the single page on the site where a visitor has
 * already decided they want the newsletter, and it did not offer them a way to
 * get it. It told them to "sign up at the bottom of any page" — sending someone
 * who is standing in front of the thing they want to go and look for it
 * elsewhere. The signup section from the home page now closes this page, which
 * is the one place on the site it most obviously belongs.
 *
 * The archive shelf is the same card as Publications: cover, issue, date, file
 * size, download. It renders whatever is published in the Newsletter category,
 * and falls back to the "on its way" panel when that is nothing — which is
 * still the honest state until FXB migrates the back issues the brief mentions.
 */
export default async function NewslettersPage() {
  const newsletters = await getPublicationsIn("newsletter");
  const newsletterCopy = await getSection("band:newsletter");

  /**
   * One shelf for both kinds of newsletter, newest first.
   *
   * The quarterly PDFs come from Publications; the emailed editions come from
   * the mailing list once they have been sent. A reader does not care which
   * machine produced an issue, so they are not two lists with two headings —
   * the card says which it is by where it leads: a PDF opens in a tab, an
   * emailed edition opens as a page.
   */
  const emailed = await getEmailNewsletters();
  const shelf = [
    ...newsletters.map((issue) => ({
      kind: "pdf" as const,
      key: `pdf-${issue.slug}`,
      title: issue.title,
      date: issue.date,
      image: issue.cover,
      href: issue.file?.url ?? "#",
      meta: `${formatPublicationDate(issue.date)}${
        issue.file?.bytes ? ` · PDF, ${formatBytes(issue.file.bytes)}` : ""
      }`,
    })),
    ...emailed.map((edition) => ({
      kind: "email" as const,
      key: `email-${edition.id}`,
      title: edition.title,
      date: edition.date,
      image: edition.image,
      href: `/news-insights/newsletters/${edition.id}`,
      meta: formatDate(edition.date),
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return (
    <>
      <PageHeader
        path="/news-insights/newsletters"
        breadcrumbs={[{ label: "News & Insights", href: "/news-insights" }]}
        eyebrow="NEWSLETTERS"
        title="Four times a year"
        intro="Our quarterly newsletter gathers the districts, the programmes and the people in one place."
      />

      <SubNav items={newsInsightsNav} ariaLabel="News and Insights" />

      <section className="bg-white pt-14 pb-20 lg:pt-16 lg:pb-24">
        {shelf.length > 0 ? (
          <Container>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shelf.map((issue, index) => {
                const card =
                  "wedge group flex h-full flex-col overflow-hidden border border-gray-15 transition-colors duration-500 hover:border-blue";

                const inner = (
                  <>
                    {/* Landscape, though a PDF's cover is portrait — the same
                        shape and the same reasoning as the publications shelf,
                        which see. An edition with no picture keeps the frame,
                        so a row of cards stays a row. */}
                    <span className="relative flex aspect-4/3 items-center justify-center overflow-hidden bg-blue-08">
                      {issue.image ? (
                        <Image
                          src={issue.image.url}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                          className={`motion-transform object-cover transition-transform duration-700 ease-(--ease-standard) group-hover:scale-[1.04] ${
                            issue.kind === "pdf" ? "object-top" : ""
                          }`}
                        />
                      ) : (
                        <Mail className="size-8 text-blue" aria-hidden="true" />
                      )}
                    </span>

                    <span className="flex flex-1 flex-col gap-3 p-6">
                      <span className="flex-1 text-xl leading-snug font-semibold text-blue">
                        {issue.title}
                      </span>
                      <span className="text-sm text-gray-80">{issue.meta}</span>
                      <span className="flex items-center gap-2 text-sm font-semibold text-blue">
                        {issue.kind === "pdf" ? (
                          <>
                            <ExternalLink className="size-4" aria-hidden="true" />
                            Read
                            <span className="sr-only"> (opens in a new tab)</span>
                          </>
                        ) : (
                          <>
                            Read
                            <ArrowRight
                              className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                              aria-hidden="true"
                            />
                          </>
                        )}
                      </span>
                    </span>
                  </>
                );

                return (
                  <Reveal as="li" key={issue.key} delay={Math.min(index, 3) * 60}>
                    {issue.kind === "pdf" ? (
                      // Opened in a tab rather than forced down — see the note
                      // on the publications shelf.
                      <a
                        href={issue.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={card}
                      >
                        {inner}
                      </a>
                    ) : (
                      <Link href={issue.href} className={card}>
                        {inner}
                      </Link>
                    )}
                  </Reveal>
                );
              })}
            </ul>
          </Container>
        ) : (
          // No longer sends the reader away to find the form — it is directly
          // below this panel now.
          <EmptyState
            title="The archive is on its way"
            body="Our previous quarterly newsletters are being migrated to this page. In the meantime, sign up below and the next issue will reach you directly — four times a year, no more."
            actions={[
              {
                label: "Latest News",
                href: "/news-insights/news",
                primary: true,
              },
              { label: "Publications", href: "/news-insights/publications" },
            ]}
          />
        )}
      </section>

      <NewsletterSignup copy={newsletterCopy} />
    </>
  );
}
