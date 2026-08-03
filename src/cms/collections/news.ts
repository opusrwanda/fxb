import type { CollectionConfig } from "payload";

/**
 * Announcements about the organisation.
 *
 * Deliberately separate from Stories. The brief draws the line and so does the
 * site: news is what FXB did, stories are about one household. Merging them
 * would make the team choose a category on every entry and get it wrong.
 *
 * `language` exists because two of the supplied articles are in French. The
 * site sets `lang` on those headings so a screen reader switches voice rather
 * than reading French with an English one.
 */
export const News: CollectionConfig = {
  slug: "news",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "date", "_status"],
    group: "Publishing",
    description: "Programme launches, partnerships, project updates, awards.",
  },
  access: { read: () => true },
  versions: { drafts: true },
  fields: [
    { name: "title", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        position: "sidebar",
        description:
          "The web address for this article, e.g. nutritional-campaign-gakenke. Lower case, words joined by hyphens. Changing it breaks any existing links.",
      },
    },
    {
      name: "date",
      type: "date",
      required: true,
      admin: { position: "sidebar", date: { pickerAppearance: "dayOnly" } },
    },
    {
      name: "language",
      type: "select",
      defaultValue: "en",
      options: [
        { label: "English", value: "en" },
        { label: "French", value: "fr" },
      ],
      admin: {
        position: "sidebar",
        description: "The language this article is written in.",
      },
    },
    {
      name: "photo",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: { description: "Shown on the news listing and at the top of the article." },
    },
    {
      name: "excerpt",
      type: "textarea",
      required: true,
      maxLength: 300,
      admin: { description: "One or two sentences, shown on the listing card." },
    },
    { name: "body", type: "richText", required: true },
  ],
};
