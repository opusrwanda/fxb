import type { CollectionConfig } from "payload";

/**
 * Impact stories — one household at a time.
 *
 * The brief is explicit that this section is about people, not projects, which
 * is why the fields ask for a person's name and district rather than a
 * programme. Same shape as News otherwise, so the team learns one editor.
 */
export const Stories: CollectionConfig = {
  slug: "stories",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "date", "_status"],
    group: "Publishing",
    description: "Accounts of one family or person, and what changed for them.",
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
      admin: { position: "sidebar", description: "Web address. Lower case, hyphens." },
    },
    {
      name: "date",
      type: "date",
      required: true,
      admin: { position: "sidebar", date: { pickerAppearance: "dayOnly" } },
    },
    {
      name: "photo",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "excerpt",
      type: "textarea",
      required: true,
      maxLength: 300,
      admin: { description: "The opening, shown on the carousel and listing." },
    },
    { name: "body", type: "richText", required: true },
  ],
};
