import type { CollectionConfig } from "payload";

/**
 * Reports, policies, brochures and the quarterly newsletter.
 *
 * One collection with a category rather than five, because they are the same
 * kind of thing — a titled, dated, downloadable file — and the site already
 * filters them by category on the Publications page. Newsletters are a
 * category here too, which is why the newsletters page needs no separate
 * source.
 *
 * The category also drives the annual report banner at the top of every page:
 * it announces whichever "Annual Report" is newest, so publishing the 2026
 * report changes the banner with no further action.
 */
export const Publications: CollectionConfig = {
  slug: "publications",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "date"],
    group: "Publishing",
    description: "Anything with a file to download.",
  },
  access: { read: () => true },
  versions: { drafts: true },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      admin: { description: "e.g. \"2025 Annual Report\", or \"Q3 2025\" for a newsletter." },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { position: "sidebar" },
    },
    {
      name: "category",
      type: "select",
      required: true,
      options: [
        { label: "Annual Report", value: "annual-report" },
        { label: "Project Report or Survey", value: "project-report" },
        { label: "Policy Document", value: "policy" },
        { label: "Brochure or Factsheet", value: "brochure" },
        { label: "Newsletter", value: "newsletter" },
      ],
      admin: {
        position: "sidebar",
        description:
          "Newsletters appear on the Newsletters page. The newest Annual Report is announced in the banner at the top of every page.",
      },
    },
    {
      name: "date",
      type: "date",
      required: true,
      admin: { position: "sidebar", date: { pickerAppearance: "dayOnly" } },
    },
    {
      name: "file",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: { description: "The PDF itself. The file size shown on the site is read from it." },
    },
    {
      name: "cover",
      type: "upload",
      relationTo: "media",
      admin: {
        description:
          "Optional cover image. Reports and newsletters normally have one; policy documents normally do not.",
      },
    },
  ],
};
