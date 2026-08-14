import { eq } from "drizzle-orm";

import { db, globals, media } from "@/staff/db";
import type { PromoBannerData, PromoBannerHeight } from "@/staff/db/schema";
import { image, type Img } from "./image";
import { cached } from "./cache";

/**
 * The campaign strip above the home page.
 *
 * Null nearly always, and that is the normal state: this exists for the weeks
 * when Kwibuka or an appeal is running and nothing the rest of the year.
 *
 * Four things have to be true before it renders, and the order matters only in
 * that any one of them failing means null — a banner that is switched on but
 * has lost its picture must not leave a clickable band of empty colour across
 * the top of the site.
 */

export type PromoBanner = {
  image: Img;
  /** Empty where it should show without being clickable. */
  href: string;
  height: PromoBannerHeight;
};

export const getPromoBanner = cached(
  "banner:promo",
  "promo-banner",
  async (): Promise<PromoBanner | null> => {
    const [row] = await db
      .select({ data: globals.data })
      .from(globals)
      .where(eq(globals.slug, "promo-banner"))
      .limit(1);

    const banner = row?.data as PromoBannerData | undefined;
    if (!banner?.enabled || !banner.imageId) return null;

    /**
     * Past its last day.
     *
     * Compared as calendar dates rather than instants. `until` is a day
     * somebody picked in a date field, not a moment — treating it as midnight
     * UTC would take a Kwibuka banner down mid-afternoon in Kigali on the last
     * day it was meant to be up.
     */
    if (banner.until) {
      const today = new Date().toISOString().slice(0, 10);
      if (today > banner.until) return null;
    }

    const [file] = await db
      .select()
      .from(media)
      .where(eq(media.id, banner.imageId))
      .limit(1);

    const picture = image(file);
    // The picture has been deleted from the library since the banner was set.
    if (!picture) return null;

    return {
      image: picture,
      href: banner.href ?? "",
      // Banners saved before the size existed have no height at all, and the
      // middle size is what they were closest to.
      height: banner.height ?? "medium",
    };
  },
);
