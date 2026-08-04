import type { Metadata } from "next";

import { unsubscribeByToken } from "@/staff/mail/subscribers";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Pill } from "@/components/ui/pill";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

/**
 * Unsubscribe.
 *
 * One click, no sign-in, no "are you sure", no survey asking why. The link in
 * the email lands here and the person is already off the list by the time the
 * page renders — anything else is a dark pattern, and a slow unsubscribe is
 * what makes somebody press "report spam" instead, which costs the sending
 * domain far more than one address.
 *
 * An unrecognised token still gets a calm page rather than an error. The link
 * may be years old, or the row may have been deleted; either way the person
 * asked to be left alone and the answer is that they will be.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await unsubscribeByToken(token) : { ok: false as const };

  return (
    <>
      <PageHeader
        eyebrow="NEWSLETTER"
        title={result.ok ? "You have been unsubscribed" : "You are not on the list"}
      />

      <section className="bg-white pb-24 lg:pb-32">
        <Container>
          <div className="wedge flex max-w-[60ch] flex-col items-start gap-6 bg-blue-08 p-9 lg:p-12">
            {result.ok ? (
              <>
                <p className="text-lg leading-relaxed text-gray">
                  We have removed{" "}
                  <strong className="font-semibold text-blue">{result.email}</strong>{" "}
                  from our mailing list. You will not receive any further
                  newsletters from us.
                </p>
                <p className="text-base leading-relaxed text-gray">
                  If this was a mistake, you can sign up again at the bottom of
                  any page.
                </p>
              </>
            ) : (
              <p className="text-lg leading-relaxed text-gray">
                This link is not one we recognise — it may have already been
                used, or it may be an old one. Either way, the address it
                belonged to is not receiving our newsletter.
              </p>
            )}

            <Pill href="/" variant="primary" size="lg">
              Back to the website
            </Pill>
          </div>
        </Container>
      </section>
    </>
  );
}
