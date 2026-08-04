import { and, desc, eq } from "drizzle-orm";

import { db, media, news } from "@/staff/db";
import type { RichText } from "@/staff/db/schema";
import { cached } from "./cache";
import { image, type Img } from "./image";

export type { RichText };

/**
 * A news item, as the site renders it.
 *
 * The shape is the one the pages have always used — slug, title, excerpt,
 * date, photograph — so what changed underneath is only where it is read from.
 */
export type NewsItem = {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO timestamp, formatted at render. */
  date: string;
  /**
   * BCP 47 tag, set only where the item is not in the site's language. FXB
   * Rwanda publishes in English and French, and a French headline needs
   * marking so a screen reader switches voice rather than reading it as
   * mangled English.
   */
  language?: string;
  image: Img | null;
  body: RichText | null;
};

/**
 * The one query both reads share.
 *
 * A left join rather than a second round trip for the photograph: four news
 * items would otherwise be five queries, and the join costs nothing on a table
 * this size.
 */
const select = {
  slug: news.slug,
  title: news.title,
  excerpt: news.excerpt,
  date: news.date,
  language: news.language,
  body: news.body,
  photo: media,
};

type Row = {
  slug: string;
  title: string;
  excerpt: string;
  date: Date;
  language: string;
  body: RichText | null;
  photo: typeof media.$inferSelect | null;
};

function toNewsItem(row: Row): NewsItem {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    date: row.date.toISOString(),
    language: row.language === "fr" ? "fr" : undefined,
    image: image(row.photo),
    body: row.body,
  };
}

/** Published news, newest first. */
export const getNews = cached("news:all", "news", async (limit?: number) => {
  const query = db
    .select(select)
    .from(news)
    .leftJoin(media, eq(news.photoId, media.id))
    .where(eq(news.status, "published"))
    .orderBy(desc(news.date));

  const rows = await (limit ? query.limit(limit) : query);
  return rows.map(toNewsItem);
});

export const getNewsItem = cached(
  "news:one",
  "news",
  async (slug: string): Promise<NewsItem | null> => {
    const rows = await db
      .select(select)
      .from(news)
      .leftJoin(media, eq(news.photoId, media.id))
      // A draft is indistinguishable from a missing slug on purpose: the page
      // 404s either way, and telling an anonymous visitor that an unpublished
      // article exists at this address is a small leak with no upside.
      .where(and(eq(news.slug, slug), eq(news.status, "published")))
      .limit(1);

    return rows[0] ? toNewsItem(rows[0]) : null;
  },
);
