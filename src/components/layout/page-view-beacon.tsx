"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Tells the server that a page was actually opened.
 *
 * The whole of the site's analytics, on the visitor's side. It renders nothing,
 * sets no cookie, reads no storage and asks for no permission — it posts a path
 * and forgets about it. What happens to that path is `staff/analytics/record`,
 * which stores no address and no identifier that outlives the day.
 *
 * It has to be a component rather than a script tag because the site is a
 * single page application after the first load: moving from the news list to a
 * story replaces the content without a new document, so there is no second page
 * load for anything else to notice. `usePathname` is what does notice.
 *
 * If the fetch fails — offline, a blocker, a server restart — nothing happens.
 * A missing row is the correct outcome of a failed count.
 */
export function PageViewBeacon() {
  const pathname = usePathname();

  /**
   * What was last reported, so a re-render does not report it again.
   *
   * React runs effects twice in development on purpose, and the server drops a
   * repeat within half a minute anyway — but a request that will be discarded
   * is still a request, and this is on every page of the site.
   */
  const last = useRef<string | null>(null);

  /**
   * Whether this is the first page of the visit.
   *
   * `document.referrer` belongs to the document, not to the page: it still says
   * "facebook.com" three articles later, because no new document was ever
   * loaded. Sending it every time would count one arrival from Facebook as
   * four. So it goes with the first page and nothing after it — which is also
   * the honest reading of the question, since somebody arrives from somewhere
   * once per visit.
   */
  const arrived = useRef(false);

  useEffect(() => {
    if (!pathname || last.current === pathname) return;
    last.current = pathname;

    const referrer = arrived.current ? null : document.referrer || null;
    arrived.current = true;

    void fetch("/api/hit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer }),
      // So the count still leaves if the reader closes the tab immediately —
      // which is exactly the visit most worth knowing about on a slow
      // connection, and the one an ordinary fetch would abandon.
      keepalive: true,
    }).catch(() => {
      // Blocked, offline, or the server is restarting. Not the reader's
      // problem, and there is nothing to retry — a view is worth one attempt.
    });
  }, [pathname]);

  return null;
}
