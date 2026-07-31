import type { Metadata } from "next";
import { Download, FileText } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal } from "@/components/ui/reveal";
import { org } from "@/lib/site";
import {
  categories,
  formatBytes,
  formatPublicationDate,
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
 * Four categories, each rendering its own shelf. `#annual-reports` is the
 * anchor the header menu links to for Annual Reports.
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

      <section className="bg-white pb-24 lg:pb-32">
        <Container className="flex flex-col gap-16 lg:gap-20">
          {categories.map((category) => {
            const items = publicationsIn(category.id);

            return (
              <div
                key={category.id}
                id={category.anchor}
                className="scroll-mt-32"
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
                          className="wedge group flex h-full flex-col gap-4 border border-gray-15 p-7 transition-colors duration-300 hover:border-blue"
                        >
                          <FileText
                            className="size-7 text-blue"
                            aria-hidden="true"
                          />
                          <span className="flex-1 text-lg leading-snug font-semibold text-blue">
                            {item.title}
                          </span>
                          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-80">
                            <span>{formatPublicationDate(item.date)}</span>
                            {item.bytes && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>PDF, {formatBytes(item.bytes)}</span>
                              </>
                            )}
                          </span>
                          <span className="flex items-center gap-2 text-sm font-semibold text-blue">
                            <Download className="size-4" aria-hidden="true" />
                            Download
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
              </div>
            );
          })}
        </Container>
      </section>
    </>
  );
}
