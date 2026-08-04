import { and, desc, eq } from "drizzle-orm";

import { db, media, stories } from "@/staff/db";
import type { RichText } from "@/staff/db/schema";
import { cached } from "./cache";
import { image, type Img } from "./image";

/**
 * An impact story — one household at a time.
 *
 * Same shape as a news item minus the language tag, and deliberately a separate
 * table: the brief draws the line between what FXB did and what changed for one
 * family, and so does the site.
 */
export type Story = {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO timestamp, formatted at render. */
  date: string;
  image: Img | null;
  body: RichText | null;
};

const select = {
  slug: stories.slug,
  title: stories.title,
  excerpt: stories.excerpt,
  date: stories.date,
  body: stories.body,
  photo: media,
};

type Row = {
  slug: string;
  title: string;
  excerpt: string;
  date: Date;
  body: RichText | null;
  photo: typeof media.$inferSelect | null;
};

const toStory = (row: Row): Story => ({
  slug: row.slug,
  title: row.title,
  excerpt: row.excerpt,
  date: row.date.toISOString(),
  image: image(row.photo),
  body: row.body,
});

export const getStories = cached("stories:all", "stories", async (limit?: number) => {
  const query = db
    .select(select)
    .from(stories)
    .leftJoin(media, eq(stories.photoId, media.id))
    .where(eq(stories.status, "published"))
    .orderBy(desc(stories.date));

  const rows = await (limit ? query.limit(limit) : query);
  return rows.map(toStory);
});

export const getStory = cached(
  "stories:one",
  "stories",
  async (slug: string): Promise<Story | null> => {
    const rows = await db
      .select(select)
      .from(stories)
      .leftJoin(media, eq(stories.photoId, media.id))
      .where(and(eq(stories.slug, slug), eq(stories.status, "published")))
      .limit(1);

    return rows[0] ? toStory(rows[0]) : null;
  },
);
