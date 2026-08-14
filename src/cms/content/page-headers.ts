import { eq } from "drizzle-orm";

import { alias } from "drizzle-orm/pg-core";

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
const video = alias(media, "banner_video");

const all = cached("page-headers:all", "pageHeaders", async () => {
  const rows = await db
    .select({ path: pageHeaders.path, media, video })
    .from(pageHeaders)
    .leftJoin(media, eq(pageHeaders.imageId, media.id))
    .leftJoin(video, eq(pageHeaders.videoId, video.id));

  return rows.reduce<Record<string, PageBanner>>((map, row) => {
    const still = image(row.media);
    map[row.path] = {
      image: still,
      /**
       * Footage only where there is a still to put behind it.
       *
       * The photograph is the poster: it paints first, carries the LCP, and is
       * what a visitor on Save-Data or reduced motion sees. A banner with a
       * video and no picture would be a blue rectangle on exactly the
       * connections least able to fetch the alternative, so the video is
       * dropped rather than shown alone.
       */
      video: still && row.video?.url ? { url: row.video.url, type: row.video.mimeType } : null,
    };
    return map;
  }, {});
});

/** A banner: the still, and the footage that plays over it where there is any. */
export type PageBanner = {
  image: Img | null;
  video: { url: string; type: string } | null;
};

/**
 * The banner for a route, or the site-wide default, or nothing.
 *
 * Nothing is a real answer and not a failure: until the team sets a default
 * every page header renders exactly as it did before, on white. That is what
 * makes this safe to ship ahead of the photographs.
 */
export async function getPageBanner(path?: string): Promise<PageBanner> {
  const map = await all();
  const found = (path && map[path]) || map["*"];
  return found ?? { image: null, video: null };
}

/**
 * Just the photograph.
 *
 * Kept because most callers only ever wanted the still — the article openings,
 * the section landings that do not move. Only `Hero` needs to know about
 * footage, and only the pages that pass a banner into one.
 */
export async function getPageHeaderImage(path?: string): Promise<Img | null> {
  return (await getPageBanner(path)).image;
}
