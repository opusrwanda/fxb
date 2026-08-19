import { asc, eq } from "drizzle-orm";

import { alias } from "drizzle-orm/pg-core";

import { areas, db, media } from "@/staff/db";
import type { RichText } from "@/staff/db/schema";
import iconSet from "@/lib/icons.json";
import { areas as seeded } from "@/lib/areas";
import { photo } from "@/lib/photos";
import { cached } from "./cache";
import { image, type Img } from "./image";

/**
 * The areas of intervention.
 *
 * One list, read by the Areas of Intervention band on What We Do and by the
 * four photographic pillars on the home page — the same areas, so the two
 * pages cannot name or illustrate them differently. They were a hand-written
 * array in `src/lib/areas.ts` until the team asked to manage them.
 *
 * That file still has one job: the photograph.
 *
 * The four areas are illustrated from the supplied FXB photography, which is
 * delivered from the Bunny pull zone at build time and is not in the media
 * library — there is no row to point `image_id` at, so the seed could not
 * carry the pictures across with the words. `illustration` below falls back to
 * the supplied photograph for an area that has not been given one in the
 * panel, which is what keeps the page looking exactly as it did. Choosing a
 * photograph in the panel replaces it, and an area added there simply has
 * none until somebody does.
 */

export type AreaCategory = "core" | "other";

export type InterventionArea = {
  /** The anchor on What We Do, and what the home page's cards link to. */
  slug: string;
  label: string;
  /**
   * The area's own page.
   *
   * It was `/what-we-do#health` — an anchor on the page the card was already
   * on, so following a pillar from the home page scrolled you to a card that
   * said the same dozen words the pillar had. Every area has a page now.
   */
  href: string;
  /** The sentence or two under the name, on the card and on the page. */
  intro?: string;
  /** The account of the area. Null where nobody has written one yet. */
  body: RichText | null;
  /**
   * The drawing to paint in the ring, from wherever it came.
   *
   * A url rather than an id from the set, because an area may now carry an
   * uploaded file instead — and the card should not have to know which. Null
   * where the area has no icon, or where the one it had has been withdrawn
   * from the set.
   */
  icon: { src: string } | null;
  image: Img | null;
  category: AreaCategory;
};

/**
 * Core areas first, and in their own order within each group.
 *
 * The category is sorted on rather than filtered here so both readers below
 * get the same sequence and neither has to know how the other orders things.
 */
/** The icon file joins `media` a second time, so it needs a name of its own. */
const iconFile = alias(media, "area_icon");

export const getAreas = cached(
  "areas",
  "areas",
  async (): Promise<InterventionArea[]> => {
    const rows = await db
      .select({ area: areas, chosen: media, icon: iconFile })
      .from(areas)
      .leftJoin(media, eq(areas.imageId, media.id))
      .leftJoin(iconFile, eq(areas.iconId, iconFile.id))
      .orderBy(asc(areas.category), asc(areas.order), asc(areas.id));

    return rows.map(({ area, chosen, icon }) => ({
      slug: area.slug,
      label: area.title,
      href: `/what-we-do/areas/${area.slug}`,
      intro: area.intro ?? undefined,
      body: area.body,
      // An uploaded file wins. Otherwise the set — and not cast blindly, since
      // an icon can be withdrawn from it after somebody has chosen it, and an
      // area whose icon no longer exists renders without one.
      icon: icon?.url ? { src: icon.url } : shipped(area.icon),
      image: image(chosen) ?? illustration(area.slug),
      category: area.category === "other" ? "other" : "core",
    }));
  }
);

export async function getAreasIn(
  category: AreaCategory
): Promise<InterventionArea[]> {
  return (await getAreas()).filter((area) => area.category === category);
}

/** Everything the home page shows. The other areas are on What We Do only. */
export const getCoreAreas = () => getAreasIn("core");

/**
 * One area, by slug.
 *
 * Read off the same cached list the cards are built from rather than queried
 * on its own — there are a dozen of these and every page already holds them
 * all, so a second query would be a round trip to find something already in
 * hand, and it could not go out of step with what the cards say.
 */
export async function getArea(slug: string): Promise<InterventionArea | null> {
  return (await getAreas()).find((area) => area.slug === slug) ?? null;
}

const SHIPPED = new Map(
  (iconSet as { id: string; src: string }[]).map((icon) => [icon.id, icon.src]),
);

function shipped(id: string | null): { src: string } | null {
  const src = id ? SHIPPED.get(id) : undefined;
  return src ? { src } : null;
}

/**
 * The supplied photograph for one of the four areas the site launched with.
 *
 * Keyed by slug, which is what the seed derived from the same list — so the
 * two stay joined without a column that only ever holds four values.
 */
function illustration(slug: string): Img | null {
  const found = seeded.find((area) => area.id === slug);
  if (!found) return null;

  const supplied = photo(found.photo);
  return {
    url: supplied.url,
    alt: found.alt,
    width: supplied.width,
    height: supplied.height,
  };
}
