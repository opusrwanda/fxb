import type { CollectionConfig } from "payload";
import { districts } from "../../lib/districts";

/**
 * The programmes FXB Rwanda runs.
 *
 * This is the collection the rest of the site leans on hardest: the Where We
 * Work map, the district counts, the programme pages and the "6 programmes
 * across 13 districts" figures in two heroes are all derived from it. Ending a
 * programme is a single toggle here and every one of those follows.
 *
 * Districts are a fixed list drawn from the official boundary data rather than
 * free text, because the map matches on the name. A typo would silently drop a
 * district off the map with nothing to show anyone what went wrong.
 */
export const Programmes: CollectionConfig = {
  slug: "programmes",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "stage", "updatedAt"],
    group: "Programmes",
    description: "What FXB Rwanda runs, where, and for how long.",
  },
  access: { read: () => true },
  versions: { drafts: true },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { position: "sidebar", description: "Web address. Lower case, hyphens." },
    },
    {
      // Named `stage`, not `status`. Payload's drafts feature creates its own
      // `enum_<collection>_status` holding draft/published, so a field called
      // `status` collides with it and Postgres rejects the values with
      // "invalid input value for enum enum_programmes_status". It also read
      // badly in the editor, where two different things were both "Status".
      name: "stage",
      type: "select",
      required: true,
      defaultValue: "current",
      label: "Stage",
      options: [
        { label: "Currently running", value: "current" },
        { label: "Phased out", value: "phased-out" },
      ],
      admin: {
        position: "sidebar",
        description:
          "Phasing a programme out removes it from the map and the counts, and moves it to the Phased-out Projects page. Nothing is deleted.",
      },
    },
    {
      name: "order",
      type: "number",
      admin: {
        position: "sidebar",
        description: "Lower numbers appear first. Leave blank to sort by name.",
      },
    },
    {
      name: "districts",
      type: "select",
      hasMany: true,
      required: true,
      options: districts
        .map((d) => ({ label: `${d.name} (${d.province})`, value: d.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      admin: {
        description:
          "Every district this programme reaches. These drive the map on Who We Are and the district counts across the site.",
      },
    },
    {
      name: "photo",
      type: "upload",
      relationTo: "media",
      admin: { description: "Used on the programme card and its own page." },
    },
    {
      name: "summary",
      type: "textarea",
      maxLength: 300,
      admin: { description: "One sentence. Opens the programme's page." },
    },
    { name: "body", type: "richText" },
    {
      name: "components",
      type: "array",
      admin: {
        description:
          "What the programme delivers — shown as \"What it delivers\" on its page.",
      },
      fields: [{ name: "item", type: "text", required: true }],
    },
    {
      name: "runs",
      type: "text",
      admin: {
        position: "sidebar",
        description: "e.g. \"August 2022 – August 2025\", or \"Ongoing\".",
      },
    },
    {
      name: "funder",
      type: "text",
      admin: { position: "sidebar", description: "e.g. USAID." },
    },
    {
      name: "externalUrl",
      type: "text",
      admin: {
        position: "sidebar",
        description:
          "Only if the programme has a system of its own, like the Sugira Muryango dashboard. Leave blank otherwise.",
      },
    },
  ],
};
