import type { CollectionConfig } from "payload";

/**
 * Vacancies and procurement notices.
 *
 * Both are the same shape — a titled thing with a closing date and a document —
 * and both pages currently say "nothing open at the moment", which is a real
 * state the site handles rather than a failure. Adding one here fills the page;
 * closing it empties it again.
 */
export const Opportunities: CollectionConfig = {
  slug: "opportunities",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "kind", "closesAt"],
    group: "Programmes",
    description: "Job openings and procurement notices.",
  },
  access: { read: () => true },
  fields: [
    { name: "title", type: "text", required: true },
    {
      name: "kind",
      type: "select",
      required: true,
      options: [
        { label: "Job vacancy", value: "career" },
        { label: "Procurement notice", value: "procurement" },
      ],
      admin: { position: "sidebar", description: "Which page it appears on." },
    },
    {
      name: "closesAt",
      type: "date",
      required: true,
      admin: {
        position: "sidebar",
        date: { pickerAppearance: "dayOnly" },
        description:
          "The site stops showing it after this date, so old vacancies cannot be applied for by mistake.",
      },
    },
    { name: "location", type: "text", admin: { description: "e.g. Kamonyi District, or Kigali." } },
    { name: "body", type: "richText", required: true },
    {
      name: "document",
      type: "upload",
      relationTo: "media",
      admin: { description: "The full terms of reference or job description, if there is one." },
    },
  ],
};
