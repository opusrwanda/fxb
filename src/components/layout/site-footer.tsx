import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SocialIcon } from "@/components/brand/social-icon";
import { Container } from "@/components/layout/container";
import { FooterNewsletter } from "@/components/layout/footer-newsletter";
import type { SiteDetails } from "@/cms/content/settings";
import { primaryNav } from "@/lib/site";

/**
 * Site footer — the last blue room.
 *
 * Two bands, not three: everything with content in it sits on one row —
 * signup, the three nav columns, and how to reach the office — with only the
 * lockup and the legal line kept back for a quiet rule underneath. Splitting
 * that content across two stacked bands made the footer read as three separate
 * things bolted together.
 *
 * The columns are taken straight from the primary nav rather than retyped, so
 * the footer cannot drift out of step with the header when a section is
 * renamed. The contact block is here rather than only on the Contact page
 * because for an organisation working across districts, "where are you and how
 * do I reach you" is the most common question a footer answers.
 */

/** Which nav sections get a column. The rest are reachable from the header. */
const COLUMNS = ["Who We Are", "What We Do", "Get Involved"];

export function SiteFooter({ details }: { details: SiteDetails }) {
  const columns = COLUMNS.map((label) => {
    const item = primaryNav.find((entry) => entry.label === label);
    if (!item) throw new Error(`Footer column has no nav entry: ${label}`);
    return item;
  });

  return (
    <footer className="bg-blue text-white">
      <Container className="py-20 lg:py-24">
        {/* The single row only resolves at xl, where there is width for five
            blocks. Below that it falls back to an ordinary wrapping grid. */}
        <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12">
          <FooterNewsletter />

          {columns.map((column) => (
            <div key={column.href} className="flex flex-col gap-5 xl:col-span-2">
              <h3 className="text-base font-semibold">
                <Link
                  href={column.href}
                  className="transition-opacity duration-300 hover:opacity-70"
                >
                  {column.label}
                </Link>
              </h3>
              <ul className="flex flex-col gap-3.5">
                {column.children?.map((child) => (
                  <li key={child.href}>
                    <Link
                      href={child.href}
                      className="text-[15px] leading-snug text-white-94 transition-colors duration-300 hover:text-white"
                    >
                      {child.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex flex-col gap-5 xl:col-span-2">
            <h3 className="text-base font-semibold">
              <Link
                href="/contact"
                className="transition-opacity duration-300 hover:opacity-70"
              >
                Contact
              </Link>
            </h3>

            <address className="flex flex-col gap-3.5 text-[15px] leading-snug not-italic">
              <a
                href={details.mapUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-start gap-2.5 text-white-94 transition-colors duration-300 hover:text-white"
              >
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  {details.address.line}, {details.address.district},{" "}
                  {details.address.country}
                </span>
              </a>
              <a
                href={`tel:${details.phoneHref}`}
                className="flex items-center gap-2.5 text-white-94 transition-colors duration-300 hover:text-white"
              >
                <Phone className="size-4 shrink-0" aria-hidden="true" />
                {details.phone}
              </a>
              <a
                href={`mailto:${details.email}`}
                className="flex items-center gap-2.5 text-white-94 transition-colors duration-300 hover:text-white"
              >
                <Mail className="size-4 shrink-0" aria-hidden="true" />
                {details.email}
              </a>
            </address>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-white-12 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3">
            {/* self-start, or the flex column stretches the lockup to the full
                column width and squashes it out of its 2.95:1 ratio. */}
            <Logo variant="white" alt={details.name} className="h-10 self-start" />
            <p className="text-sm text-white-94">{details.endorsement}</p>
          </div>

          {/* The external systems (Sugira Muryango, POMC) are deliberately not
              here — they are staff tools and the header's utility strip is
              where they belong. */}
          <div className="flex flex-col gap-4 text-sm text-white-94">
            <ul className="flex flex-wrap items-center gap-x-7 gap-y-2">
              <li>
                <Link
                  href="/privacy-policy"
                  className="transition-colors duration-300 hover:text-white"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-use"
                  className="transition-colors duration-300 hover:text-white"
                >
                  Terms of Use
                </Link>
              </li>
            </ul>
            {/* Resolved when the page is built, so it advances on deploy. */}
            <p>
              © {new Date().getFullYear()} {details.legalName}. All rights reserved.
            </p>
          </div>

          <ul className="flex flex-wrap items-center gap-2.5 lg:justify-end">
            {details.socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`${details.name} on ${social.label}`}
                  className="flex size-9 items-center justify-center rounded-full border border-white-40 text-white transition-colors duration-300 hover:border-white hover:bg-white hover:text-blue"
                >
                  <SocialIcon name={social.icon} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
