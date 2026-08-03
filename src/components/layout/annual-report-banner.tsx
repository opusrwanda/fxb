"use client";

import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { useState } from "react";
import { Container } from "@/components/layout/container";
import { latestAnnualReport } from "@/lib/publications";

/**
 * The annual report announcement, at the very top of every page.
 *
 * It names whatever `latestAnnualReport` returns and links to the annual
 * reports shelf, so publishing a new report changes the banner and nothing
 * else. No report, no banner — which is the state until FXB supplies one.
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
 * NO FLASH
 *
 * The banner is server-rendered, so a visitor who dismissed it two pages ago
 * would otherwise see it paint and then vanish on every subsequent page. The
 * inline script below runs while the parser is still on this element — before
 * anything is painted and long before React hydrates — and hides it in place.
 * React never learns, because `hidden` set outside its render is not a prop it
 * diffs. The alternative, rendering nothing until an effect confirms it is
 * wanted, pushes the whole page down a frame after paint on every load.
 */
const KEY = "fxb:annual-report-dismissed";

export function AnnualReportBanner() {
  const report = latestAnnualReport;
  const [dismissed, setDismissed] = useState(false);

  if (!report) return null;

  function dismiss() {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(KEY, report!.slug);
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

      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var b=document.getElementById('annual-report-banner');if(b&&sessionStorage.getItem('${KEY}')===${JSON.stringify(report.slug)})b.hidden=true}catch(e){}})()`,
        }}
      />
    </>
  );
}
