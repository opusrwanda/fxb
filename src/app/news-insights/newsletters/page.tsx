import type { Metadata } from "next";
import { Download } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";
import {
  formatBytes,
  formatPublicationDate,
  newsletters,
} from "@/lib/publications";

export const metadata: Metadata = {
  title: "Newsletters",
  description:
    "FXB Rwanda's quarterly newsletter — the districts, the programmes and the people, four times a year.",
};

/**
 * Newsletters.
 *
 * The brief notes the previous quarterly newsletters still need migrating, and
 * none have been supplied — so the page offers the signup instead of an empty
 * shelf. The archive appears here the moment issues land in `publications.ts`.
 */
export default function NewslettersPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "News & Insights", href: "/news-insights" }]}
        eyebrow="NEWSLETTERS"
        title="Four times a year"
        intro="Our quarterly newsletter gathers the districts, the programmes and the people in one place."
      />

      <section className="bg-white pb-24 lg:pb-32">
        {newsletters.length > 0 ? (
          <Container>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {newsletters.map((issue, index) => (
                <Reveal as="li" key={issue.slug} delay={Math.min(index, 3) * 60}>
                  <a
                    href={issue.file}
                    download
                    className="wedge flex h-full flex-col gap-4 border border-gray-15 p-7 transition-colors duration-300 hover:border-blue"
                  >
                    <span className="flex-1 text-lg leading-snug font-semibold text-blue">
                      {issue.title}
                    </span>
                    <span className="text-sm text-gray-80">
                      {formatPublicationDate(issue.date)}
                      {issue.bytes ? ` · PDF, ${formatBytes(issue.bytes)}` : ""}
                    </span>
                    <span className="flex items-center gap-2 text-sm font-semibold text-blue">
                      <Download className="size-4" aria-hidden="true" />
                      Download
                    </span>
                  </a>
                </Reveal>
              ))}
            </ul>
          </Container>
        ) : (
          <EmptyState
            title="The archive is on its way"
            body="Our previous quarterly newsletters are being migrated to this page. In the meantime, sign up at the bottom of any page and the next issue will reach you directly — a few times a year, no more."
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
    </>
  );
}
