import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Privacy Policy",
  // Not indexed while it has no policy in it: a placeholder privacy page in
  // search results is worse than no result at all.
  robots: { index: false, follow: true },
};

/**
 * Privacy Policy.
 *
 * Linked from the footer and from the newsletter consent line, so the route has
 * to exist — a consent checkbox pointing at a 404 is not consent.
 *
 * The content brief contains no privacy policy, and this is not a document to
 * draft on an organisation's behalf: it makes binding statements about what
 * FXB Rwanda does with personal data, and it has to match Rwanda's Law No.
 * 058/2021 on the protection of personal data. So the page says honestly that
 * it is being prepared and gives a route to the office, and FXB's own text
 * drops in here.
 */
export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHeader
        eyebrow="LEGAL"
        title="Privacy Policy"
        intro="How FXB Rwanda collects, uses and protects personal information."
      />

      <section className="bg-white pb-24 lg:pb-32">
        <Container>
          <EmptyState
            title="This policy is being prepared"
            body="Our privacy policy is being finalised for publication here. In the meantime, if you have any question about how FXB Rwanda handles personal information — including anything you have submitted through this website or our newsletter — please contact the office and we will answer it directly."
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
