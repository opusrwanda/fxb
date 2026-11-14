import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";

/**
 * The annual report announcement, at the very top of every page.
 *
 * By default it names whichever Annual Report is newest and links to the annual
 * reports shelf, so publishing a new one in `/staff` changes the banner and
 * nothing else. The team can instead write their own line and link in Site
 * details — an appeal, an event, a vacancy — and clearing that box hands the
 * strip back to the report. Neither, and there is no banner.
 *
 * The line is passed in rather than read here: the CMS is only reachable
 * from the server, so the layout decides which of the two it is.
 *
 * NO DISMISSAL
 *
 * There is no close button and no dismissed state. It used to have both, kept
 * in `sessionStorage` against the report's slug, and the two behaviours read as
 * the same thing from the outside but are not: the header collapsing this away
 * on scroll is the announcement getting out of the way, and it returns at the
 * top of the page. Being dismissed removed it for the rest of the visit.
 *
 * Losing the button takes the storage key with it, and the effect that read it
 * back — which also removes the one frame of banner that a full page load used
 * to paint before that effect could hide it. The component is now plain enough
 * to render on the server with no client state at all.
 */
export function AnnualReportBanner({
  announcement,
}: {
  announcement: { text: string; href: string } | null;
}) {
  if (!announcement) return null;

  const line = "flex min-w-0 items-center gap-2.5 text-[13px] font-medium text-white sm:text-sm";
  // An address on another site opens beside this one rather than replacing it.
  const external = /^https?:\/\//.test(announcement.href);

  return (
    <div
      id="annual-report-banner"
      className="border-b border-white-12 bg-blue-90"
    >
      <Container className="flex items-center py-2.5">
        {announcement.href ? (
          <Link
            href={announcement.href}
            className={`group ${line}`}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            <span className="truncate">{announcement.text}</span>
            <ArrowRight
              className="size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        ) : (
          // Words with nowhere to go: shown, with no arrow promising a page.
          <p className={line}>
            <span className="truncate">{announcement.text}</span>
          </p>
        )}
      </Container>
    </div>
  );
}
