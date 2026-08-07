import { eq } from "drizzle-orm";

import { db, media, pageHeaders } from "@/staff/db";
import { cached } from "./cache";
import { image, type Img } from "./image";

/**
 * The photograph behind a page's opening block.
 *
 * The pages this covers are files rather than documents — Contact, Careers,
 * Procurement and the listings are hand-built routes with no row of their own —
 * so the banner is keyed by route and joined up here.
 *
 * One query for the whole table, cached, rather than a lookup per page. There
 * are at most a dozen rows and every page asks for exactly one of them; a query
 * per request would be a round trip to save reading a handful of paths.
 */
const all = cached("page-headers:all", "pageHeaders", async () => {
  const rows = await db
    .select({ path: pageHeaders.path, media })
    .from(pageHeaders)
    .leftJoin(media, eq(pageHeaders.imageId, media.id));

  return rows.reduce<Record<string, Img | null>>((map, row) => {
    map[row.path] = image(row.media);
    return map;
  }, {});
});

/**
 * The banner for a route, or the site-wide default, or nothing.
 *
 * Nothing is a real answer and not a failure: until the team sets a default
 * every page header renders exactly as it did before, on white. That is what
 * makes this safe to ship ahead of the photographs.
 */
export async function getPageHeaderImage(path?: string): Promise<Img | null> {
  const map = await all();
  if (path && map[path]) return map[path];
  return map["*"] ?? null;
}
