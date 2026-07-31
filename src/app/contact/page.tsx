import type { Metadata } from "next";
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
import { org, socials } from "@/lib/site";

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
 * NOTE: the brief also asks for a QR code beside the social links, pointing at
 * linktr.ee/fxbrwanda. Generating one needs either an encoder dependency or the
 * artwork from FXB, so the link itself is here in the meantime and the QR is
 * flagged.
 */
const faqs = [
  {
    id: "partner",
    title: "How can I partner with FXB Rwanda?",
    body: (
      <p className="max-w-[62ch] text-base leading-relaxed text-gray">
        Please contact us through the form above, or email us at{" "}
        <a
          href={`mailto:${org.email}`}
          className="font-medium text-blue underline underline-offset-4 hover:text-green"
        >
          {org.email}
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
      <p className="max-w-[62ch] text-base leading-relaxed text-gray">
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
      <p className="max-w-[62ch] text-base leading-relaxed text-gray">
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
      <p className="max-w-[62ch] text-base leading-relaxed text-gray">
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

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="CONTACT"
        title="Let's connect"
        intro="Whether you have a question, would like to partner with us, make a donation, explore career opportunities, or simply learn more about our work, we would be delighted to hear from you."
      />

      <section className="bg-white pb-24 lg:pb-32">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-20">
            {/* Get in touch */}
            <Reveal className="flex flex-col gap-8">
              <div>
                <h2 className="text-xs font-semibold tracking-[0.22em] text-gray-40">
                  GET IN TOUCH
                </h2>
                <p className="mt-4 text-2xl font-bold tracking-[-0.02em] text-blue">
                  {org.name}
                </p>
              </div>

              <address className="flex flex-col gap-6 not-italic">
                <a
                  href={org.mapUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex items-start gap-4"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-08">
                    <MapPin className="size-5 text-blue" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm text-gray-40">
                      Office address
                    </span>
                    <span className="block text-base leading-snug text-gray transition-colors duration-200 group-hover:text-blue">
                      {org.address.line}, {org.address.district},{" "}
                      {org.address.country}
                    </span>
                  </span>
                </a>

                <a
                  href={`tel:${org.phoneHref}`}
                  className="group flex items-start gap-4"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-08">
                    <Phone className="size-5 text-blue" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm text-gray-40">Phone</span>
                    <span className="block text-base text-gray transition-colors duration-200 group-hover:text-blue">
                      {org.phone}
                    </span>
                  </span>
                </a>

                <a
                  href={`mailto:${org.email}`}
                  className="group flex items-start gap-4"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-08">
                    <Mail className="size-5 text-blue" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm text-gray-40">Email</span>
                    <span className="block text-base text-gray transition-colors duration-200 group-hover:text-blue">
                      {org.email}
                    </span>
                  </span>
                </a>

                <div className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-08">
                    <Clock className="size-5 text-blue" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm text-gray-40">
                      Office hours
                    </span>
                    <span className="block text-base text-gray">
                      {org.officeHours}
                    </span>
                    <span className="block text-sm text-gray-40">
                      Closed on weekends and public holidays.
                    </span>
                  </span>
                </div>
              </address>

              {/* Connect with us */}
              <div className="border-t border-gray-15 pt-8">
                <h2 className="text-xs font-semibold tracking-[0.22em] text-gray-40">
                  CONNECT WITH US
                </h2>
                <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-gray">
                  Follow FXB Rwanda to stay updated on our latest programmes,
                  stories and opportunities.
                </p>
                <ul className="mt-5 flex flex-wrap items-center gap-2.5">
                  {socials.map((social) => (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={`${org.name} on ${social.label}`}
                        className="flex size-11 items-center justify-center rounded-full border border-gray-15 text-blue transition-colors duration-200 hover:border-blue hover:bg-blue hover:text-white"
                      >
                        <SocialIcon name={social.icon} />
                      </a>
                    </li>
                  ))}
                </ul>
                <a
                  href={org.linktree}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-5 inline-block text-[15px] font-medium text-blue underline underline-offset-4 transition-colors duration-200 hover:text-green"
                >
                  All our links in one place
                </a>
              </div>
            </Reveal>

            {/* Send us a message */}
            <Reveal delay={100} className="flex flex-col gap-8">
              <div>
                <h2 className="text-xs font-semibold tracking-[0.22em] text-gray-40">
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
                <span className="h-px w-10 bg-green" aria-hidden="true" />
                <span className="text-xs font-semibold tracking-[0.22em] text-gray-40">
                  FIND US
                </span>
              </div>
              <h2 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[40px]">
                Ruyenzi, Kamonyi District
              </h2>
            </div>
            <Pill href={org.mapUrl} variant="outline" size="lg">
              Get Directions
            </Pill>
          </Reveal>

          <Reveal delay={80} className="mt-10">
            <OfficeMap />
          </Reveal>
        </Container>
      </section>

      {/* FAQ */}
      <section className="bg-white pb-24 lg:pb-32">
        <Container>
          <div className="flex flex-col gap-10 lg:flex-row lg:gap-24">
            <Reveal className="lg:w-80 lg:shrink-0">
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-green" aria-hidden="true" />
                <span className="text-xs font-semibold tracking-[0.22em] text-gray-40">
                  FAQ
                </span>
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[40px] lg:leading-[1.1]">
                Frequently asked questions
              </h2>
            </Reveal>

            <Reveal delay={80} className="flex-1">
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
      <section className="bg-blue py-20 lg:py-24">
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
