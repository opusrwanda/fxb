import type { News } from "../payload-types";
import { image, type Img } from "./image";
import { cached, cms } from "./payload";

export type RichText = News["body"];

/**
 * A news item, as the site renders it.
 *
 * The shape is the one the pages already used when this came from a TypeScript
 * module — slug, title, excerpt, date, photograph — so what changed underneath
 * is only where it is read from. `body` is the exception: rich text now, not an
 * array of paragraphs, because the team writes it in an editor with links and
 * headings rather than as string literals.
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
  body: RichText;
};

function toNewsItem(doc: News): NewsItem {
  return {
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt,
    date: doc.date,
    language: doc.language === "fr" ? "fr" : undefined,
    image: image(doc.photo),
    body: doc.body,
  };
}

/**
 * Published news, newest first.
 *
 * `_status` has to be filtered by hand: a document saved as a draft and never
 * published still sits in the collection, and Payload's `find` will hand it
 * over unless asked not to.
 */
export const getNews = cached("news:all", "news", async (limit?: number) => {
  const payload = await cms();
  const { docs } = await payload.find({
    collection: "news",
    where: { _status: { equals: "published" } },
    sort: "-date",
    limit: limit ?? 0,
    depth: 1,
    pagination: false,
  });
  return docs.map(toNewsItem);
});

export const getNewsItem = cached(
  "news:one",
  "news",
  async (slug: string): Promise<NewsItem | null> => {
    const payload = await cms();
    const { docs } = await payload.find({
      collection: "news",
      where: { slug: { equals: slug }, _status: { equals: "published" } },
      limit: 1,
      depth: 1,
      pagination: false,
    });
    return docs[0] ? toNewsItem(docs[0]) : null;
  },
);
