"use client";

import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Container } from "@/components/layout/container";

/**
 * The annual report announcement, at the very top of every page.
 *
 * It names whichever Annual Report is newest and links to the annual reports
 * shelf, so publishing a new one in `/staff` changes the banner and nothing
 * else. No report, no banner — which is the state until FXB supplies one.
 *
 * The report is passed in rather than read here: this is a client component and
 * the CMS is only reachable from the server, so the layout does the asking.
 *
 * DISMISSAL
 *
 * Kept in `sessionStorage` against the report's own slug, which gives the two
 * behaviours the brief asks for out of one value:
 *
 *   - it survives navigation, because session storage does, so dismissing it
 *     once dismisses it for the whole visit rather than for one page;
 *   - it does not survive the browser session, so it returns next visit;
 *   - and it is keyed by slug, so publishing a newer report makes every
 *     existing dismissal stale and the banner comes back on its own.
 *
 * `localStorage` would have got the first of those and broken the second.
 *
 * WITHIN A VISIT vs A FULL RELOAD
 *
 * Moving between pages keeps the header mounted, so the dismissal is instant
 * and invisible — React state carries it. A *full* page load re-renders the
 * banner from the server, which cannot know what is in session storage, so it
 * paints for one frame before the effect below hides it.
 *
 * Two attempts to remove that frame were abandoned. An inline script inside
 * this component is never executed on a client navigation and React 19 reports
 * it as an error; the same script moved to the root layout reaches the HTML but
 * does not survive hydration. Both were fighting the framework to save a single
 * frame on a repeat visit, which is not a trade worth making — so the effect
 * stays, and the flash is the honest cost.
 */
export const DISMISS_KEY = "fxb:annual-report-dismissed";

export function AnnualReportBanner({
  report,
}: {
  report: { title: string; slug: string } | null;
}) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!report) return;
    try {
      if (window.sessionStorage.getItem(DISMISS_KEY) === report.slug) {
        const id = window.setTimeout(() => setDismissed(true), 0);
        return () => window.clearTimeout(id);
      }
    } catch {
      // Storage unavailable. The banner simply stays, which is the safe way
      // round — an announcement shown twice beats one that cannot be shown.
    }
  }, [report]);

  if (!report) return null;

  function dismiss() {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, report!.slug);
    } catch {
      // Private mode, or storage disabled. Closing it for this page is still
      // better than refusing to close it at all.
    }
  }

  return (
    <>
      <div
        id="annual-report-banner"
        hidden={dismissed}
        className="border-b border-white-12 bg-blue-90"
      >
        <Container className="flex items-center gap-3 py-2.5">
          <Link
            href="/news-insights/publications#annual-reports"
            className="group flex min-w-0 flex-1 items-center gap-2.5 text-[13px] font-medium text-white sm:text-sm"
          >
            <span className="truncate">
              Read our {report.title}
            </span>
            <ArrowRight
              className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>

          {/* 36px rather than the icon's own size — small, because the banner is
              slim, but never a 16px target on a phone. */}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss the annual report announcement"
            className="-mr-2 flex size-9 shrink-0 items-center justify-center rounded-full text-white-94 transition-colors duration-200 hover:bg-white-12 hover:text-white"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </Container>
      </div>
    </>
  );
}
