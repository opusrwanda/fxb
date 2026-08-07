import type { Metadata } from "next";
import { Download } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";
import { formatDate } from "@/cms/content/date";
import { getOpenings } from "@/cms/content/opportunities";
import { formatBytes } from "@/cms/content/publications";
import { Prose } from "@/components/layout/prose";

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
export default async function ProcurementPage() {
  const tenders = await getOpenings("procurement");
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
                  key={tender.id}
                  delay={Math.min(index, 3) * 60}
                  className="border-t border-gray-15 last:border-b"
                >
                  <div className="flex flex-col gap-6 py-9 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
                    <div className="flex flex-col gap-3 lg:max-w-[44ch]">
                      <h2 className="text-2xl font-bold tracking-[-0.02em] text-blue lg:text-[28px]">
                        {tender.title}
                      </h2>
                      {tender.location && (
                        <p className="text-base text-gray">{tender.location}</p>
                      )}
                      <p className="text-sm font-semibold text-blue">
                        Submissions close {formatDate(tender.closesAt)}
                      </p>
                    </div>

                    <div className="flex flex-1 flex-col items-start gap-4">
                      <Prose data={tender.body} />
                      {tender.document && (
                        <a
                          href={tender.document.url}
                          download
                          className="flex items-center gap-2.5 text-[15px] font-medium text-blue underline underline-offset-4 transition-colors duration-300 hover:text-green"
                        >
                          <Download className="size-4" aria-hidden="true" />
                          Terms of reference
                          {tender.document.bytes && (
                            <span className="text-gray-80">
                              ({formatBytes(tender.document.bytes)})
                            </span>
                          )}
                        </a>
                      )}
                    </div>
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
