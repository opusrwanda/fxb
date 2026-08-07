import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { SocialIcon } from "@/components/brand/social-icon";
import { Container } from "@/components/layout/container";
import { ContactForm } from "@/components/layout/contact-form";
import { OfficeMap } from "@/components/layout/office-map";
import { PageHeader } from "@/components/layout/page-header";
import { Accordion } from "@/components/ui/accordion";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { getSiteDetails, type SiteDetails } from "@/cms/content/settings";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with FXB Rwanda — our headquarters in Ruyenzi, Kamonyi District, office hours, and a message form.",
};

/**
 * Contact.
 *
 * Not a hero route: it opens on white with the header already solid.
 *
 * The FAQ is the same accordion the FXBVillage principles use. The brief marks
 * it optional; it earns its place because every one of its four answers routes
 * somebody away from a general enquiry and towards the page that actually
 * answers them.
 *
 * The QR code beside the social links is FXB's own artwork, not one generated
 * here. It was decoded before it went in and points at linktr.ee/fxbrwanda,
 * the same place `brand.linktree` does — worth checking rather than assuming,
 * because a QR code is the one image on a site whose destination nobody can
 * read by looking at it.
 */
function buildFaqs(details: SiteDetails) {
  return [
  {
    id: "partner",
    title: "How can I partner with FXB Rwanda?",
    body: (
      <p className="max-w-[58ch] text-base leading-relaxed text-gray">
        Please contact us through the form above, or email us at{" "}
        <a
          href={`mailto:${details.email}`}
          className="font-medium text-blue underline underline-offset-4 hover:text-green"
        >
          {details.email}
        </a>
        . You can also read about the ways to work with us on our{" "}
        <Link
          href="/get-involved/partners"
          className="font-medium text-blue underline underline-offset-4 hover:text-green"
        >
          Partner With Us
        </Link>{" "}
        page.
      </p>
    ),
  },
  {
    id: "donate",
    title: "How can I make a donation?",
    body: (
      <p className="max-w-[58ch] text-base leading-relaxed text-gray">
        Our{" "}
        <Link
          href="/get-involved/donate"
          className="font-medium text-blue underline underline-offset-4 hover:text-green"
        >
          Donate
        </Link>{" "}
        page carries the bank transfer details. If you would like to support a
        specific programme or need a donation acknowledgement, contact the team
        and we will help.
      </p>
    ),
  },
  {
    id: "jobs",
    title: "How do I apply for a job?",
    body: (
      <p className="max-w-[58ch] text-base leading-relaxed text-gray">
        All available vacancies are published on the{" "}
        <Link
          href="/get-involved/careers"
          className="font-medium text-blue underline underline-offset-4 hover:text-green"
        >
          Careers
        </Link>{" "}
        page, each with how to apply and a closing date. We do not accept
        applications for roles that are not advertised.
      </p>
    ),
  },
  {
    id: "procurement",
    title: "Where can I find procurement opportunities?",
    body: (
      <p className="max-w-[58ch] text-base leading-relaxed text-gray">
        Current opportunities are published on the{" "}
        <Link
          href="/get-involved/procurement"
          className="font-medium text-blue underline underline-offset-4 hover:text-green"
        >
          Procurement Opportunities
        </Link>{" "}
        page, in line with our procurement policies.
      </p>
    ),
  },
  ];
}

export default async function ContactPage() {
  const details = await getSiteDetails();
  const faqs = buildFaqs(details);

  return (
    <>
      <PageHeader
        path="/contact"
        eyebrow="CONTACT"
        title="Let's connect"
        intro="Whether you have a question, would like to partner with us, make a donation, explore career opportunities, or simply learn more about our work, we would be delighted to hear from you."
      />

      <section className="bg-green-10 py-24 lg:py-32">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-20">
            {/* Get in touch */}
            <Reveal className="flex flex-col gap-8">
              <div>
                <h2 className="text-xs font-semibold tracking-[0.14em] text-gray">
                  GET IN TOUCH
                </h2>
                <p className="mt-4 text-2xl font-bold tracking-[-0.02em] text-blue">
                  {details.name}
                </p>
              </div>

              <address className="flex flex-col gap-6 not-italic">
                <a
                  href={details.mapUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex items-start gap-4"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-08">
                    <MapPin className="size-5 text-blue" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm text-gray">
                      Office address
                    </span>
                    <span className="block text-base leading-snug text-gray transition-colors duration-300 group-hover:text-blue">
                      {details.address.line}, {details.address.district},{" "}
                      {details.address.country}
                    </span>
                  </span>
                </a>

                <a
                  href={`tel:${details.phoneHref}`}
                  className="group flex items-start gap-4"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-08">
                    <Phone className="size-5 text-blue" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm text-gray">Phone</span>
                    <span className="block text-base text-gray transition-colors duration-300 group-hover:text-blue">
                      {details.phone}
                    </span>
                  </span>
                </a>

                <a
                  href={`mailto:${details.email}`}
                  className="group flex items-start gap-4"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-08">
                    <Mail className="size-5 text-blue" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm text-gray">Email</span>
                    <span className="block text-base text-gray transition-colors duration-300 group-hover:text-blue">
                      {details.email}
                    </span>
                  </span>
                </a>

                <div className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-08">
                    <Clock className="size-5 text-blue" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm text-gray">
                      Office hours
                    </span>
                    <span className="block text-base text-gray">
                      {details.officeHours}
                    </span>
                    <span className="block text-sm text-gray">
                      Closed on weekends and public holidays.
                    </span>
                  </span>
                </div>
              </address>

              {/* Connect with us */}
              <div className="border-t border-gray-15 pt-8">
                <h2 className="text-xs font-semibold tracking-[0.14em] text-gray">
                  CONNECT WITH US
                </h2>
                <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-gray">
                  Follow FXB Rwanda to stay updated on our latest programmes,
                  stories and opportunities.
                </p>
                <ul className="mt-5 flex flex-wrap items-center gap-2.5">
                  {details.socials.map((social) => (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={`${details.name} on ${social.label}`}
                        className="flex size-11 items-center justify-center rounded-full border border-gray-15 text-blue transition-colors duration-300 hover:border-blue hover:bg-blue hover:text-white"
                      >
                        <SocialIcon name={social.icon} />
                      </a>
                    </li>
                  ))}
                </ul>
                {/* The code and the link are the same destination for two
                    different readers: somebody on a laptop taps the words,
                    somebody holding a phone up to a printed page or a screen
                    points the camera. Both go to linktr.ee/fxbrwanda, which is
                    `brand.linktree` — the artwork is not the source of truth
                    for where it goes, it is a second rendering of it. */}
                <div className="mt-6 flex items-center gap-5">
                  <Image
                    src="/img/qr-linktree.png"
                    alt=""
                    width={768}
                    height={768}
                    sizes="112px"
                    className="size-28 shrink-0 rounded-card border border-gray-15 p-1.5"
                  />
                  <div>
                    <p className="text-[15px] leading-snug font-medium text-blue">
                      Scan for all our links
                    </p>
                    <a
                      href={details.linktree}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-1 inline-block text-[15px] text-gray underline underline-offset-4 transition-colors duration-300 hover:text-green"
                    >
                      linktr.ee/fxbrwanda
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Send us a message */}
            <Reveal delay={180} className="flex flex-col gap-8">
              <div>
                <h2 className="text-xs font-semibold tracking-[0.14em] text-gray">
                  SEND US A MESSAGE
                </h2>
                <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-gray">
                  Our team is here to assist you and will respond to your
                  enquiry as promptly as possible.
                </p>
              </div>
              <ContactForm />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Find us */}
      <section className="bg-white pb-24 lg:pb-32">
        <Container>
          <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
                <span className="text-[24px] font-semibold tracking-[0.14em] text-gray-80">
                  FIND US
                </span>
              </div>
              <h2 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[40px]">
                Ruyenzi, Kamonyi District
              </h2>
            </div>
            <Pill href={details.mapUrl} variant="outline" size="lg">
              Get Directions
            </Pill>
          </Reveal>

          <Reveal delay={140} className="mt-10">
            <OfficeMap details={details} />
          </Reveal>
        </Container>
      </section>

      {/* FAQ */}
      <section className="bg-white pb-24 lg:pb-32">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-10">
            <Reveal className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
              <div className="flex items-center gap-4">
                <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
                <span className="text-[24px] font-semibold tracking-[0.14em] text-gray-80">
                  FAQ
                </span>
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[42px] lg:leading-[1.08]">
                Frequently asked questions
              </h2>
            </Reveal>

            <Reveal delay={140} className="lg:col-span-7 lg:col-start-6">
              <Accordion
                defaultOpen={null}
                items={faqs.map((faq) => ({
                  id: faq.id,
                  title: faq.title,
                  content: faq.body,
                }))}
              />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Call to action */}
      <section className="bg-blue py-16 lg:py-20">
        <Container>
          <Reveal className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
            <h2 className="max-w-[32ch] text-2xl font-bold tracking-[-0.02em] text-white lg:text-[32px] lg:leading-[1.2]">
              Together, we can build resilient communities and create a brighter
              future for children and families.
            </h2>
            <div className="flex flex-wrap gap-4">
              <Pill href="/get-involved/donate" variant="donate" size="lg">
                Donate Now
              </Pill>
              <Pill href="/what-we-do" variant="outlineLight" size="lg">
                Explore Our Work
              </Pill>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
