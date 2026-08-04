import { revalidateTag } from "next/cache";

/**
 * The tag every cached read carries, on top of its own collection's.
 *
 * Busting it clears the whole site. That is what a change to the media library
 * has to do — a photograph is embedded in news cards, programme pages, the
 * board and the reach figures, so replacing one image or rewriting one `alt`
 * touches pages no single collection tag would reach.
 */
export const EVERYTHING = "cms";

/**
 * Drop the site's cache for one collection after the panel writes to it.
 *
 * The reads in `src/cms/content` are cached until told otherwise, which is the
 * only arrangement that gives the team both a fast site and an immediate one:
 * pressing Publish clears the tag, the next request rebuilds the page, and
 * nobody has to know what a revalidation window is.
 *
 * `{ expire: 0 }` rather than the recommended `"max"` profile. `"max"` is
 * stale-while-revalidate: the next visitor is served the previous version and
 * the fresh one is built behind them. That is the right trade for a product
 * catalogue and the wrong one here — the next visitor after a publish is nearly
 * always the person who just pressed Publish, checking their own work.
 *
 * The `try` is not defensive coding for its own sake: a migration or a seed
 * script writes from a plain Node process with no Next cache to talk to, and
 * `revalidateTag` throws there. The write should still succeed.
 */
export function bust(tag: string): void {
  try {
    revalidateTag(tag, { expire: 0 });
    if (tag !== EVERYTHING) revalidateTag(EVERYTHING, { expire: 0 });
  } catch {
    // Not running inside Next. Nothing is cached, so nothing to invalidate.
  }
}
