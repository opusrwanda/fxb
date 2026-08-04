import { eq, inArray } from "drizzle-orm";

import { db, globals, media } from "@/staff/db";
import type { ImpactData } from "@/staff/db/schema";
import { cached } from "./cache";
import { image, type Img } from "./image";

/**
 * One of the reach figures.
 *
 * `value` is nullable because three of the figures the home page shows are
 * components of an aggregate MEL has not split out yet. Those render without a
 * number rather than with an invented one — a made-up statistic on a page about
 * vulnerable households is not a placeholder, it is a false claim.
 */
export type ReachFigure = {
  /** Slug of the label, used as the anchor on Our Impact. */
  id: string;
  label: string;
  value: number | null;
  caption: string;
  /** Revealed when someone points at the figure. */
  areas: string[];
  image: Img | null;
};

export type Reach = {
  figures: ReachFigure[];
  /** FXBVillage projects delivered to date. */
  projectsDelivered: number;
  /** Where the figures come from and when they were last updated. */
  note?: string;
};

const slug = (label: string) =>
  label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const getReach = cached("impact", "impact", async (): Promise<Reach> => {
  const [row] = await db.select().from(globals).where(eq(globals.slug, "impact")).limit(1);

  const data = (row?.data as ImpactData | undefined) ?? {
    figures: [],
    projectsDelivered: 0,
    note: null,
  };

  // The photographs are ids inside the JSON, so they are fetched in one go and
  // indexed rather than joined — there is no row per figure to join against.
  const ids = data.figures.map((f) => f.photoId).filter((id): id is number => id != null);
  const photos = ids.length
    ? await db.select().from(media).where(inArray(media.id, ids))
    : [];
  const byId = new Map(photos.map((photo) => [photo.id, photo]));

  return {
    figures: data.figures.map((figure) => ({
      id: slug(figure.label),
      label: figure.label,
      value: figure.value ?? null,
      caption: figure.caption,
      areas: figure.areas ?? [],
      image: image(figure.photoId ? byId.get(figure.photoId) : null),
    })),
    projectsDelivered: data.projectsDelivered,
    note: data.note ?? undefined,
  };
});
