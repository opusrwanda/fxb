import { asc, eq } from "drizzle-orm";

import { areas, db, media } from "@/staff/db";
import type { IconId } from "@/components/brand/icon";
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
  blurb: string;
  href: string;
  focus: string[];
  /** Null where the area has no icon, or where its icon has been withdrawn. */
  icon: IconId | null;
  image: Img | null;
  category: AreaCategory;
};

/**
 * Core areas first, and in their own order within each group.
 *
 * The category is sorted on rather than filtered here so both readers below
 * get the same sequence and neither has to know how the other orders things.
 */
export const getAreas = cached(
  "areas",
  "areas",
  async (): Promise<InterventionArea[]> => {
    const rows = await db
      .select({ area: areas, chosen: media })
      .from(areas)
      .leftJoin(media, eq(areas.imageId, media.id))
      .orderBy(asc(areas.category), asc(areas.order), asc(areas.id));

    return rows.map(({ area, chosen }) => ({
      slug: area.slug,
      label: area.title,
      blurb: area.blurb ?? "",
      href: `/what-we-do#${area.slug}`,
      focus: area.focus,
      // Not cast blindly: `BrandIcon` throws on an id it does not know, and an
      // icon can be withdrawn from the set after somebody has chosen it. An
      // area whose icon no longer exists renders without one.
      icon: isIconId(area.icon) ? area.icon : null,
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

const ICON_IDS = new Set((iconSet as { id: string }[]).map((icon) => icon.id));

function isIconId(id: string | null): id is IconId {
  return !!id && ICON_IDS.has(id);
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
