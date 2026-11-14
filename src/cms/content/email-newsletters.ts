import { desc, eq, isNotNull } from "drizzle-orm";

import { campaigns, db, media } from "@/staff/db";
import type { CampaignContent, RichText, RichTextNode } from "@/staff/db/schema";
import { cached } from "./cache";
import { image, type Img } from "./image";

/**
 * The emailed newsletters, as pages on the site.
 *
 * An edition used to exist in two places only: the inboxes it was sent to, and
 * the panel it was written in. Anybody who joined the list afterwards, or who
 * was sent a link by a colleague, had nothing to read. Each one is now a page,
 * listed on Newsletters beside the quarterly PDFs with its thumbnail.
 *
 * SENT, NOT SAVED. An edition appears once it has gone to the list — `sentAt`
 * is stamped by the first real send and never by a test — so a draft is not
 * published by being written, and nothing shows on the site that subscribers
 * have not been sent. An edition can also be kept off the site altogether —
 * "Show on the website" on its form — which is what a trial wants.
 *
 * In the code these are still "campaigns", which is the table's name.
 */
export type EmailNewsletter = {
  id: number;
  title: string;
  /** The preview line, or the introduction where there is none. */
  excerpt: string;
  /** The day it was sent, as an ISO date. */
  date: string;
  image: Img | null;
  body: RichText | null;
};

const text = (value: string, format = 0): RichTextNode => ({
  type: "text",
  version: 1,
  text: value,
  format,
});

const paragraph = (children: RichTextNode[]): RichTextNode => ({
  type: "paragraph",
  version: 1,
  children,
});

/**
 * The whole edition as one document the article page can draw.
 *
 * The letter is two things in the email — the text written in the editor, and
 * the template's story modules after it — and the site has one renderer for
 * prose. So the modules are restated as the nodes that renderer already knows:
 * a heading, a picture, a paragraph, a link. What is email furniture rather
 * than content (the banner, the "Dear [name]") is left out.
 */
function compose(
  body: RichText | null,
  content: CampaignContent | null,
): RichText | null {
  const nodes: RichTextNode[] = [];

  if (content?.intro?.trim()) {
    for (const chunk of content.intro.split(/\n{2,}/)) {
      if (chunk.trim()) nodes.push(paragraph([text(chunk.trim())]));
    }
  }

  nodes.push(...(body?.root?.children ?? []));

  for (const story of content?.stories ?? []) {
    if (!story.headline && !story.excerpt && !story.imageUrl) continue;

    if (story.headline) {
      nodes.push({
        type: "heading",
        version: 1,
        tag: "h2",
        children: [text(story.headline)],
      });
    }
    if (story.imageUrl) {
      nodes.push({ type: "image", version: 1, src: story.imageUrl, alt: "" });
    }
    for (const chunk of (story.excerpt ?? "").split(/\n{2,}/)) {
      if (chunk.trim()) nodes.push(paragraph([text(chunk.trim())]));
    }
    if (story.quote) {
      nodes.push({
        type: "quote",
        version: 1,
        children: [
          text(
            story.quoteAuthor
              ? `${story.quote} — ${story.quoteAuthor}`
              : story.quote,
          ),
        ],
      });
    }
    for (const src of [story.photoAUrl, story.photoBUrl]) {
      if (src) nodes.push({ type: "image", version: 1, src, alt: "" });
    }
    const links = [
      story.url && { label: "Read the full story", url: story.url },
      story.videoUrl && {
        label: story.videoTitle || "Watch the video",
        url: story.videoUrl,
      },
    ].filter(Boolean) as { label: string; url: string }[];
    for (const link of links) {
      nodes.push(
        paragraph([
          {
            type: "link",
            version: 1,
            fields: { url: link.url, newTab: /^https?:\/\//.test(link.url) },
            children: [text(link.label)],
          },
        ]),
      );
    }
  }

  for (const src of content?.galleryImages ?? []) {
    if (src) nodes.push({ type: "image", version: 1, src, alt: "" });
  }

  if (nodes.length === 0) return null;

  return {
    root: {
      type: "root",
      children: nodes,
      direction: null,
      format: "",
      indent: 0,
      version: 1,
    },
  };
}

type Row = {
  campaign: typeof campaigns.$inferSelect;
  photo: typeof media.$inferSelect | null;
};

function toNewsletter({ campaign, photo }: Row): EmailNewsletter {
  return {
    id: campaign.id,
    title: campaign.subject,
    excerpt:
      campaign.preheader?.trim() || campaign.content?.intro?.trim() || "",
    // A string, not a Date: the cache stores JSON, and a Date that went in
    // comes back out as a string anyway, typed as something it no longer is.
    date: (campaign.sentAt ?? campaign.createdAt).toISOString().slice(0, 10),
    image: image(photo),
    body: compose(campaign.body, campaign.content),
  };
}

/** Every edition that has been sent, newest first. */
export const getEmailNewsletters = cached(
  "email-newsletters:all",
  "campaigns",
  async (): Promise<EmailNewsletter[]> => {
    const rows = await db
      .select({ campaign: campaigns, photo: media })
      .from(campaigns)
      .leftJoin(media, eq(campaigns.heroId, media.id))
      .where(isNotNull(campaigns.sentAt))
      .orderBy(desc(campaigns.sentAt));

    return rows
      .filter(({ campaign }) => !campaign.content?.hideFromSite)
      .map(toNewsletter);
  },
);

/** One edition by its number, or null where it has not been sent. */
export async function getEmailNewsletter(
  id: number,
): Promise<EmailNewsletter | null> {
  return (await getEmailNewsletters()).find((item) => item.id === id) ?? null;
}
