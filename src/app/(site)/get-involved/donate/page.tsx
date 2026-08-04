import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal } from "@/components/ui/reveal";
import { getSiteDetails } from "@/cms/content/settings";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Support FXB Rwanda. Every contribution helps vulnerable children, families and communities build resilient and self-reliant futures.",
};

/**
 * Donate.
 *
 * There is no payment gateway: the brief's instruction is a bank transfer, and
 * the account details it supplies are reproduced here exactly. No amount
 * presets, no card form, nothing that implies an online checkout that does not
 * exist.
 *
 * The details are set in a description list rather than prose so an account
 * number can be read off — or copied — without hunting through a sentence, and
 * in a tabular figure style so the digits line up.
 */
const helps = [
  "Protect vulnerable children and strengthen families.",
  "Improve access to quality education and healthcare.",
  "Promote food security, nutrition and sustainable livelihoods.",
  "Empower women, youth and communities through economic opportunities.",
  "Build resilient communities capable of creating lasting change for future generations.",
];

const bankDetails = [
  ["Bank Name", "I&M Bank Rwanda"],
  ["Account Name", "Francois Xavier Bagnoud"],
  ["Account Number", "25001965004"],
  ["Branch", "Headquarters"],
  ["SWIFT Code", "RWRWRW"],
];

export default async function DonatePage() {
  const details = await getSiteDetails();

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Get Involved", href: "/get-involved" }]}
        eyebrow="DONATE"
        title="Your gift changes lives"
        intro="Every child deserves the opportunity to grow up healthy, safe, educated and full of hope. By donating to FXB Rwanda, you become part of a lasting solution."
      />

      <section className="bg-white pb-24 lg:pb-32">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <Reveal className="flex flex-col gap-6">
              <p className="text-base leading-relaxed text-gray lg:text-[17px]">
                At FXB Rwanda, we believe that sustainable change begins by
                restoring dignity. Rather than providing short-term assistance
                alone, we work alongside communities to strengthen livelihoods,
                improve access to quality education and healthcare, promote
                child protection, enhance nutrition, support economic
                empowerment, and build resilience against future challenges.
              </p>

              <div>
                <h2 className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                  YOUR GENEROSITY HELPS US
                </h2>
                <ul className="mt-5 flex flex-col gap-3.5">
                  {helps.map((item) => (
                    <li key={item} className="flex gap-3.5">
                      <span
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-green"
                        aria-hidden="true"
                      />
                      <span className="text-base leading-snug text-gray">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-base leading-relaxed text-gray lg:text-[17px]">
                Every contribution — large or small — makes a meaningful
                difference. Together, we can create opportunities, restore hope,
                and transform lives.
              </p>
            </Reveal>

            <Reveal delay={100}>
              <div className="wedge bg-blue-08 p-8 lg:p-10">
                <h2 className="text-2xl font-bold tracking-[-0.02em] text-blue lg:text-[28px]">
                  Make a donation
                </h2>
                <p className="mt-3 max-w-[46ch] text-base leading-relaxed text-gray">
                  You can support our work by making a secure bank transfer
                  using the details below.
                </p>

                <dl className="mt-8 flex flex-col">
                  {bankDetails.map(([label, value]) => (
                    <div
                      key={label}
                      className="flex flex-col gap-1 border-t border-gray-15 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                    >
                      <dt className="text-sm text-gray-80">{label}</dt>
                      <dd className="text-base font-semibold text-blue tabular-nums">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-6 text-[15px] leading-relaxed text-gray">
                  These bank details are dedicated exclusively to donations
                  supporting the mission and programmes of FXB Rwanda.
                </p>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-bold tracking-[-0.02em] text-blue">
                  Need assistance?
                </h3>
                <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-gray">
                  If you have questions about donating, would like to support a
                  specific programme, or require a donation acknowledgement, we
                  would be delighted to assist you.
                </p>
                <div className="mt-4 flex flex-col gap-1.5">
                  <a
                    href={`mailto:${details.email}`}
                    className="text-base font-semibold text-blue underline underline-offset-4 transition-colors duration-200 hover:text-green"
                  >
                    {details.email}
                  </a>
                  <a
                    href={`tel:${details.phoneHref}`}
                    className="text-base font-semibold text-blue underline underline-offset-4 transition-colors duration-200 hover:text-green"
                  >
                    {details.phone}
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="bg-blue py-16 lg:py-20">
        <Container>
          <Reveal className="flex flex-col gap-5">
            <h2 className="max-w-[26ch] text-2xl font-bold tracking-[-0.02em] text-white lg:text-[36px] lg:leading-[1.15]">
              Together, we can build a world fit for children.
            </h2>
            <p className="max-w-[58ch] text-base leading-relaxed text-white-94 lg:text-[17px]">
              Thank you for standing with vulnerable children, families and
              communities. Your generosity helps restore dignity, strengthen
              resilience, and create lasting opportunities for generations to
              come.
            </p>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
