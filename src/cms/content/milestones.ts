import { asc, eq } from "drizzle-orm";

import { db, media, milestones } from "@/staff/db";
import { cached } from "./cache";
import { image, type Img } from "./image";

export type Milestone = {
  year: string;
  body: string;
  /** Null renders the year panel instead — see `our-story.tsx`. */
  image: Img | null;
  current: boolean;
};

/**
 * The Our Story timeline, in the order the team set.
 *
 * These were six entries hardcoded in the component. They are dates in an
 * organisation's history, which is exactly the kind of content that gets a
 * correction, a new entry, or a photograph found in an archive years later —
 * none of which should need a developer.
 */
export const getMilestones = cached("milestones:all", "milestones", async () => {
  const rows = await db
    .select({ milestone: milestones, media })
    .from(milestones)
    .leftJoin(media, eq(milestones.imageId, media.id))
    .orderBy(asc(milestones.order));

  return rows.map(
    (row): Milestone => ({
      year: row.milestone.year,
      body: row.milestone.body,
      image: image(row.media),
      current: row.milestone.current,
    })
  );
});
