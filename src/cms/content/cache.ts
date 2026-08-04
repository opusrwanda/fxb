import { unstable_cache } from "next/cache";

import { EVERYTHING } from "../revalidate";

/**
 * Wrap a read so the site serves it from cache until someone edits it.
 *
 * Without this every page would query Postgres on every request, for content
 * that changes a few times a month. With a plain time-based revalidate the
 * team would press Publish and then wait, with no way to tell whether it had
 * worked. So the cache is kept indefinitely and dropped on the edit itself:
 * the staff panel calls `bust()` from `src/cms/revalidate.ts` after every
 * write, and the change is live on the next request.
 *
 * `name` has to be unique across the site — it is the cache key, and two reads
 * sharing one would serve each other's results.
 */
export function cached<Args extends unknown[], Result>(
  name: string,
  tag: string,
  read: (...args: Args) => Promise<Result>,
): (...args: Args) => Promise<Result> {
  return unstable_cache(read, [name], { tags: [tag, EVERYTHING] });
}
