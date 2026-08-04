import { revalidateTag } from "next/cache";
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from "payload";

/**
 * The tag every cached read carries, on top of its own collection's.
 *
 * Busting it clears the whole site. That is what a change to the media library
 * has to do — a photograph is embedded in news cards, programme pages, the
 * board and the reach figures, so replacing one image or rewriting one `alt`
 * touches pages no single collection tag would reach.
 *
 * It lives here rather than beside the reads because the Media collection
 * needs it, and a collection importing from `content/` would have the Payload
 * config importing a module that imports the Payload config.
 */
export const EVERYTHING = "cms";

/**
 * Drop the site's cache for one collection when it is edited.
 *
 * The reads in `src/cms/content` are cached until told otherwise, which is the
 * only arrangement that gives the team both a fast site and an immediate one:
 * pressing Publish clears the tag, the next request rebuilds the page, and
 * nobody has to know what a revalidation window is.
 *
 * The `try` is not defensive coding for its own sake. These hooks also run
 * outside a request — `npm run seed` is a plain Node process with no Next
 * cache to talk to, and `revalidateTag` throws there. Seeding wants the write
 * to succeed; there is nothing cached to clear.
 */
function bust(tag: string) {
  try {
    // `{ expire: 0 }` rather than the recommended `"max"` profile. `"max"` is
    // stale-while-revalidate: the next visitor is served the previous version
    // and the fresh one is built behind them. That is the right trade for a
    // product catalogue and the wrong one here — the next visitor after a
    // publish is nearly always the person who just pressed Publish, checking
    // their own work. Expiring outright costs one slower request and means the
    // page they reload is the page they just wrote.
    revalidateTag(tag, { expire: 0 });
  } catch {
    // Not running inside Next. Nothing is cached, so nothing to invalidate.
  }
}

/** The hooks a collection needs to keep the site in step with it. */
export function revalidates(tag: string): {
  afterChange: CollectionAfterChangeHook[];
  afterDelete: CollectionAfterDeleteHook[];
} {
  return {
    afterChange: [({ doc }) => (bust(tag), doc)],
    afterDelete: [({ doc }) => (bust(tag), doc)],
  };
}

/** The same, for a global — which has no delete. */
export function revalidatesGlobal(tag: string): {
  afterChange: GlobalAfterChangeHook[];
} {
  return {
    afterChange: [({ doc }) => (bust(tag), doc)],
  };
}
