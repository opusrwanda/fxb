import type { Metadata } from "next";
import { Download } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";
import { formatBytes } from "@/lib/publications";
import { formatDeadline, tenders } from "@/lib/opportunities";

export const metadata: Metadata = {
  title: "Procurement Opportunities",
  description:
    "Open tenders at FXB Rwanda for suppliers, consultants and service providers, published in line with our procurement policies.",
};

/**
 * Procurement Opportunities.
 *
 * Two states, like Careers: the brief writes both. The list is empty today, so
 * the page runs the second one — which still says something useful about how
 * FXB procures, rather than showing a bare heading.
 */
export default function ProcurementPage() {
  const open = tenders.length > 0;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Get Involved", href: "/get-involved" }]}
        eyebrow="PROCUREMENT"
        title="Procurement opportunities"
        intro="FXB Rwanda is committed to transparent, fair and competitive procurement. All opportunities are published here in line with our procurement policies."
      />

      <section className="bg-white pb-24 lg:pb-32">
        {open ? (
          <Container>
            <ul className="flex flex-col">
              {tenders.map((tender, index) => (
                <Reveal
                  as="li"
                  key={tender.slug}
                  delay={index * 60}
                  className="border-t border-gray-15 last:border-b"
                >
                  <div className="flex flex-col gap-6 py-9 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
                    <div className="flex flex-col gap-3 lg:max-w-[44ch]">
                      <h2 className="text-2xl font-bold tracking-[-0.02em] text-blue lg:text-[28px]">
                        {tender.title}
                      </h2>
                      <p className="text-sm text-gray-40">
                        Ref. {tender.reference} · {tender.category}
                      </p>
                      <p className="text-base text-gray">
                        Published {formatDeadline(tender.published)}
                      </p>
                      <p className="text-sm font-semibold text-blue">
                        Submissions close {formatDeadline(tender.deadline)}
                      </p>
                    </div>

                    <ul className="flex flex-1 flex-col items-start gap-3">
                      {tender.documents.map((document) => (
                        <li key={document.file}>
                          <a
                            href={document.file}
                            download
                            className="flex items-center gap-2.5 text-[15px] font-medium text-blue underline underline-offset-4 transition-colors duration-200 hover:text-green"
                          >
                            <Download className="size-4" aria-hidden="true" />
                            {document.label}
                            {document.bytes && (
                              <span className="text-gray-40">
                                ({formatBytes(document.bytes)})
                              </span>
                            )}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </ul>
          </Container>
        ) : (
          <EmptyState
            title="Thank you for your interest"
            body="There are currently no open procurement opportunities at FXB Rwanda. We encourage interested suppliers and service providers to visit this page regularly, as all procurement opportunities are published here in accordance with our procurement policies and principles of transparency and fairness. We appreciate your interest in working with us and look forward to future opportunities for collaboration."
            note="There are currently no active tenders. Please check back later."
            actions={[
              {
                label: "Partner With Us",
                href: "/get-involved/partners",
                primary: true,
              },
              { label: "Contact Us", href: "/contact" },
            ]}
          />
        )}
      </section>
    </>
  );
}
