import type { CollectionConfig } from "payload";

import { revalidates } from "../revalidate";

/**
 * Partners, donors and collaborators.
 *
 * The 34 supplied logos were cropped and trimmed by a script because they
 * arrived pasted into a template with inconsistent padding. Anything uploaded
 * here is used as given, so the note asks for a trimmed logo on transparency —
 * the alternative is a logo wall that looks drunk.
 */
export const Partners: CollectionConfig = {
  slug: "partners",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "category"],
    group: "People",
    description: "Organisations shown on the partner walls.",
  },
  hooks: revalidates("partners"),
  access: { read: () => true },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "category",
      type: "select",
      required: true,
      options: [
        { label: "Development Partner", value: "development" },
        { label: "Government", value: "government" },
        { label: "Institutional Donor", value: "donor" },
        { label: "Corporate", value: "corporate" },
      ],
      admin: { position: "sidebar", description: "Which section of the Partners page." },
    },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: {
        description:
          "The logo on its own, trimmed to its edges, ideally on a transparent background. Do not include a frame or a coloured box.",
      },
    },
    {
      name: "url",
      type: "text",
      admin: { position: "sidebar", description: "Their website, if it should link out." },
    },
  ],
};
