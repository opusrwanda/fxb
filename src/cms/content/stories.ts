import type { Story as StoryDoc } from "../payload-types";
import { image, type Img } from "./image";
import type { RichText } from "./news";
import { cached, cms } from "./payload";

/**
 * An impact story — one household at a time.
 *
 * Same shape as a news item minus the language tag, and deliberately a separate
 * collection: the brief draws the line between what FXB did and what changed
 * for one family, and so does the site.
 */
export type Story = {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO timestamp, formatted at render. */
  date: string;
  image: Img | null;
  body: RichText;
};

function toStory(doc: StoryDoc): Story {
  return {
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt,
    date: doc.date,
    image: image(doc.photo),
    body: doc.body,
  };
}

export const getStories = cached(
  "stories:all",
  "stories",
  async (limit?: number) => {
    const payload = await cms();
    const { docs } = await payload.find({
      collection: "stories",
      where: { _status: { equals: "published" } },
      sort: "-date",
      limit: limit ?? 0,
      depth: 1,
      pagination: false,
    });
    return docs.map(toStory);
  },
);

export const getStory = cached(
  "stories:one",
  "stories",
  async (slug: string): Promise<Story | null> => {
    const payload = await cms();
    const { docs } = await payload.find({
      collection: "stories",
      where: { slug: { equals: slug }, _status: { equals: "published" } },
      limit: 1,
      depth: 1,
      pagination: false,
    });
    return docs[0] ? toStory(docs[0]) : null;
  },
);
