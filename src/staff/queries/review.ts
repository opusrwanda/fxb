import { asc, eq } from "drizzle-orm";

import { db, news, publications, stories, users } from "../db";

/**
 * What is waiting for an admin to look at.
 *
 * An editor may publish their own work — FXB was explicit that they are
 * trusted to — but they may also say "I have finished this, someone check it
 * before it goes out". That second option is only worth offering if somebody
 * actually sees the result, and the honest place for that is the first screen
 * an admin lands on. A queue nobody is shown is a queue nobody empties, and an
 * editor who submits into silence publishes directly next time.
 *
 * Three collections, because those are the three an editor writes. A union
 * rather than a generic loop over the table list: there are three of them, they
 * name their title column differently, and each needs its own URL back into the
 * panel — the generic version would be longer than this and harder to read.
 */

export type Pending = {
  collection: string;
  /** The URL segment, which is not always the collection key. */
  slug: string;
  id: number;
  title: string;
  authorId: number | null;
  author: string | null;
  updatedAt: Date;
};

export async function pendingReview(): Promise<Pending[]> {
  const [newsRows, storyRows, publicationRows] = await Promise.all([
    db
      .select({
        id: news.id,
        title: news.title,
        authorId: news.authorId,
        author: users.name,
        updatedAt: news.updatedAt,
      })
      .from(news)
      .leftJoin(users, eq(news.authorId, users.id))
      .where(eq(news.status, "in_review"))
      .orderBy(asc(news.updatedAt)),

    db
      .select({
        id: stories.id,
        title: stories.title,
        authorId: stories.authorId,
        author: users.name,
        updatedAt: stories.updatedAt,
      })
      .from(stories)
      .leftJoin(users, eq(stories.authorId, users.id))
      .where(eq(stories.status, "in_review"))
      .orderBy(asc(stories.updatedAt)),

    db
      .select({
        id: publications.id,
        title: publications.title,
        authorId: publications.authorId,
        author: users.name,
        updatedAt: publications.updatedAt,
      })
      .from(publications)
      .leftJoin(users, eq(publications.authorId, users.id))
      .where(eq(publications.status, "in_review"))
      .orderBy(asc(publications.updatedAt)),
  ]);

  return [
    ...newsRows.map((row) => ({ ...row, collection: "News", slug: "news" })),
    ...storyRows.map((row) => ({ ...row, collection: "Story", slug: "stories" })),
    ...publicationRows.map((row) => ({
      ...row,
      collection: "Publication",
      slug: "publications",
    })),
    // Oldest first. This is a queue, and the thing that has been waiting
    // longest is the one somebody is wondering about.
  ].sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
}

/**
 * The same, for an editor.
 *
 * What they have handed over and not had back. Shown on their dashboard so
 * "did anyone look at this yet" is answerable without asking. Matched on the
 * id rather than the name, because two colleagues can share a name and only
 * one of them wrote it.
 */
export async function pendingByAuthor(authorId: number): Promise<Pending[]> {
  const all = await pendingReview();
  return all.filter((row) => row.authorId === authorId);
}
