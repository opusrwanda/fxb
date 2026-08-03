import type { Metadata } from "next";
import Image from "next/image";
import { Download, FileText } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { PublicationTabs } from "@/components/layout/publication-tabs";
import { SubNav, newsInsightsNav } from "@/components/layout/sub-nav";
import { Reveal } from "@/components/ui/reveal";
import { photo } from "@/lib/photos";
import { org } from "@/lib/site";
import {
  categories,
  formatBytes,
  formatPublicationDate,
  publications,
  publicationsIn,
} from "@/lib/publications";

export const metadata: Metadata = {
  title: "Publications",
  description:
    "Annual reports, project reports and surveys, policy documents, brochures and factsheets from FXB Rwanda.",
};

/**
 * Publications.
 *
 * Four categories, each rendering its own shelf, behind a filter.
 *
 * The shelves are built here, on the server, and handed to the client filter as
 * props — so the whole listing is in the HTML for a crawler and only the chips
 * ship as JavaScript. `#annual-reports` is the anchor the header menu and the
 * Our Impact page both link to, and the filter reads it on arrival.
 *
 * Every entry shows what the brief asks for — cover, title, category, date,
 * file size, download. No files have been supplied yet, so each shelf instead
 * lists what belongs on it, which is real information (a visitor learns the
 * Safeguarding Policy exists and can ask for it) rather than a spinner.
 */
export default function PublicationsPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "News & Insights", href: "/news-insights" }]}
        eyebrow="PUBLICATIONS"
        title="Reports, research and policy"
        intro="Access reports, research, policy documents, brochures and other publications that showcase our work, impact and learning."
      />

      <SubNav items={newsInsightsNav} ariaLabel="News and Insights" />

      <section className="bg-white pt-14 pb-24 lg:pt-16 lg:pb-32">
        <Container>
          {publications.some((item) => item.draft) && (
            <p className="wedge mb-10 border border-gray-15 bg-blue-08 px-6 py-4 text-[15px] leading-relaxed text-gray">
              <strong className="font-semibold text-blue">
                Draft listing.
              </strong>{" "}
              These entries are placeholders prepared for layout review. The
              documents do not exist yet and the download links will not
              resolve.
            </p>
          )}

          <PublicationTabs
            tabs={categories.map(({ id, label, anchor }) => ({
              id,
              label,
              anchor,
            }))}
            shelves={Object.fromEntries(
              categories.map((category) => {
                const items = publicationsIn(category.id);

                return [
                  category.id,
                  <div
                    key={category.id}
                    id={category.anchor}
                    className="scroll-mt-36"
                  >
                    <Reveal className="flex flex-col gap-3">
                      <h2 className="text-2xl font-bold tracking-[-0.02em] text-blue lg:text-[28px]">
                        {category.label}
                      </h2>
                      <p className="max-w-[58ch] text-base leading-relaxed text-gray">
                        {category.description}
                      </p>
                    </Reveal>

                    {items.length > 0 ? (
                      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((item, index) => (
                          <Reveal
                            as="li"
                            key={item.slug}
                            delay={Math.min(index, 3) * 60}
                            className="h-full"
                          >
                            <a
                              href={item.file}
                              download
                              className="wedge group flex h-full flex-col overflow-hidden border border-gray-15 transition-colors duration-300 hover:border-blue"
                            >
                              {/* A cover where one exists, the file glyph where
                                  it does not. Reports get cover art; a policy
                                  document does not, and a stock photograph on a
                                  Safeguarding Policy would be decoration
                                  pretending to be a cover. Because the filter
                                  shows one category at a time, each shelf is
                                  internally consistent either way. */}
                              {item.cover ? (
                                <span className="relative block aspect-3/4 overflow-hidden bg-blue-08">
                                  <Image
                                    src={photo(item.cover).url}
                                    alt=""
                                    fill
                                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                                    className="motion-transform object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.04]"
                                  />
                                </span>
                              ) : (
                                <span className="flex aspect-3/1 items-center justify-center bg-blue-08">
                                  <FileText
                                    className="size-8 text-blue"
                                    aria-hidden="true"
                                  />
                                </span>
                              )}

                              <span className="flex flex-1 flex-col gap-4 p-6">
                                <span className="flex-1 text-lg leading-snug font-semibold text-blue">
                                  {item.title}
                                </span>
                                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-80">
                                  <span>
                                    {formatPublicationDate(item.date)}
                                  </span>
                                  {item.bytes && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span>
                                        PDF, {formatBytes(item.bytes)}
                                      </span>
                                    </>
                                  )}
                                </span>
                                <span className="flex items-center gap-2 text-sm font-semibold text-blue">
                                  <Download
                                    className="size-4"
                                    aria-hidden="true"
                                  />
                                  Download
                                </span>
                              </span>
                            </a>
                          </Reveal>
                        ))}
                      </ul>
                    ) : (
                      <Reveal
                        delay={60}
                        className="wedge mt-8 flex flex-col gap-5 bg-blue-08 p-8"
                      >
                        <p className="text-sm font-semibold tracking-[0.16em] text-gray-80">
                          COMING TO THIS PAGE
                        </p>
                        <ul className="flex flex-wrap gap-2.5">
                          {category.examples.map((example) => (
                            <li
                              key={example}
                              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-blue"
                            >
                              {example}
                            </li>
                          ))}
                        </ul>
                        <p className="max-w-[58ch] text-[15px] leading-relaxed text-gray">
                          These are being prepared for publication. To request a
                          copy in the meantime, email{" "}
                          <a
                            href={`mailto:${org.email}`}
                            className="font-medium text-blue underline underline-offset-4 hover:text-green"
                          >
                            {org.email}
                          </a>
                          .
                        </p>
                      </Reveal>
                    )}
                  </div>,
                ];
              }),
            )}
          />
        </Container>
      </section>
    </>
  );
}
