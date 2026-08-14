import type { Metadata } from "next";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
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
        {newsletters.length > 0 ? (
          <Container>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {newsletters.map((issue, index) => (
                <Reveal as="li" key={issue.slug} delay={Math.min(index, 3) * 60}>
                  {/* Opened in a tab rather than forced down — see the note
                      on the publications shelf. */}
                  <a
                    href={issue.file?.url ?? "#"}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="wedge group flex h-full flex-col overflow-hidden border border-gray-15 transition-colors duration-500 hover:border-blue"
                  >
                    {/* Landscape, though the cover is portrait — the same
                        shape and the same reasoning as the publications shelf,
                        which see. Four issues arrive every year and none ever
                        leaves, so this is the shelf that grows fastest and has
                        most to gain from a card half the height. */}
                    {issue.cover && (
                      <span className="relative block aspect-4/3 overflow-hidden bg-blue-08">
                        <Image
                          src={issue.cover.url}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                          className="motion-transform object-cover object-top transition-transform duration-700 ease-(--ease-standard) group-hover:scale-[1.04]"
                        />
                      </span>
                    )}

                    <span className="flex flex-1 flex-col gap-3 p-6">
                      <span className="flex-1 text-xl leading-snug font-semibold text-blue">
                        {issue.title}
                      </span>
                      <span className="text-sm text-gray-80">
                        {formatPublicationDate(issue.date)}
                        {issue.file?.bytes
                          ? ` · PDF, ${formatBytes(issue.file.bytes)}`
                          : ""}
                      </span>
                      <span className="flex items-center gap-2 text-sm font-semibold text-blue">
                        <ExternalLink className="size-4" aria-hidden="true" />
                        Read
                        <span className="sr-only"> (opens in a new tab)</span>
                      </span>
                    </span>
                  </a>
                </Reveal>
              ))}
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

      <NewsletterSignup />
    </>
  );
}
