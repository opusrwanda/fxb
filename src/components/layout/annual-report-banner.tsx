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
 * ALWAYS ON, ALWAYS THE SAME SIZE
 *
 * The banner has no dismiss control and no dismissed state. It used to keep one
 * in `sessionStorage` against the report's slug; the announcement is now a
 * permanent fixture of the header instead, so all of that — the button, the
 * key, the effect that hid the banner a frame after a full page load, and the
 * flash that came with it — is gone.
 *
 * It does not shrink on scroll either. A first cut collapsed it to a 28px strip
 * once the header pinned, which is the sort of thing that looks considerate in
 * a spec and reads as the banner having gone away on the actual page. A single
 * height means what the reader sees at the top of the page is what they see at
 * the bottom of it.
 *
 * The height is fixed rather than derived from padding, because the pinned
 * header's total height is a number two sticky navigation bars pin against.
 * See `--h-header` in globals.css — change the height here and change it there.
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
      className="flex h-11 items-center overflow-hidden border-b border-white-12 bg-blue-90"
    >
      <Container className="flex items-center">
        <Link
          href="/news-insights/publications#annual-reports"
          className="group flex min-w-0 items-center gap-2.5 text-[13px] font-medium text-white sm:text-sm"
        >
          <span className="truncate">Read our {report.title}</span>
          <ArrowRight
            className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </Container>
    </div>
  );
}
