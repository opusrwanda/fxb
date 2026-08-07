import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";

/**
 * The annual report announcement, at the very top of every page.
 *
 * It names whichever Annual Report is newest and links to the annual reports
 * shelf, so publishing a new one in `/staff` changes the banner and nothing
 * else. No report, no banner — which is the state until FXB supplies one.
 *
 * The report is passed in rather than read here: the CMS is only reachable
 * from the server, so the layout does the asking.
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
  report,
}: {
  report: { title: string; slug: string } | null;
}) {
  if (!report) return null;

  return (
    <div
      id="annual-report-banner"
      className="border-b border-white-12 bg-blue-90"
    >
      <Container className="flex items-center py-2.5">
        <Link
          href="/news-insights/publications#annual-reports"
          className="group flex min-w-0 items-center gap-2.5 text-[13px] font-medium text-white sm:text-sm"
        >
          <span className="truncate">Read our {report.title}</span>
          <ArrowRight
            className="size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </Container>
    </div>
  );
}
