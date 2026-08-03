import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Terms of Use",
  robots: { index: false, follow: true },
};

/**
 * Terms of Use.
 *
 * Linked from the footer, so the route exists. As with the privacy policy, the
 * brief supplies no text and this is not a document to write on FXB Rwanda's
 * behalf — it is a legal statement about the organisation's own site. FXB's
 * text drops in here.
 */
export default function TermsOfUsePage() {
  return (
    <>
      <PageHeader
        eyebrow="LEGAL"
        title="Terms of Use"
        intro="The terms on which this website is made available."
      />

      <section className="bg-white pb-24 lg:pb-32">
        <Container>
          <EmptyState
            title="These terms are being prepared"
            body="Our terms of use are being finalised for publication here. If you have a question about using this website, or about reproducing any of its content or photography, please get in touch with the office."
            actions={[
              { label: "Contact Us", href: "/contact", primary: true },
              { label: "Who We Are", href: "/who-we-are" },
            ]}
          />
        </Container>
      </section>
    </>
  );
}
