import { record } from "@/staff/analytics/record";

/**
 * The beacon the site posts to when a page has been opened.
 *
 * Deliberately the least interesting endpoint on the site: it takes a path,
 * writes a row, and answers with nothing. There is no reply worth reading, so
 * it does not send one — 204, no body, nothing for the browser to parse and
 * nothing for a caller to depend on.
 *
 * WHY A ROUND TRIP AT ALL, when the server already knows which page it just
 * rendered. Because the server also renders pages nobody has looked at. Next
 * prefetches a route the moment a link to it comes near the pointer, and a
 * count taken during rendering would report those as reading — the most-read
 * list would fill up with whatever the header happens to link to. A hit only
 * exists here once a browser has actually painted the page.
 *
 * The response is uncacheable by construction, being a POST, so there is no
 * `revalidate` to think about.
 */
export async function POST(request: Request) {
  let payload: { path?: unknown; referrer?: unknown };

  try {
    payload = await request.json();
  } catch {
    return new Response(null, { status: 204 });
  }

  /**
   * The path is taken from the body rather than from the request.
   *
   * This request's own URL is `/api/hit` — the page being counted is only in
   * the body, and `record` is what decides whether it is a path worth counting
   * at all. Nothing here trusts it beyond passing it on.
   */
  await record({
    path: typeof payload.path === "string" ? payload.path : "",
    referrer: typeof payload.referrer === "string" ? payload.referrer : null,
    headers: request.headers,
  });

  return new Response(null, { status: 204 });
}
