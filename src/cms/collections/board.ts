import type { CollectionConfig } from "payload";

import { revalidates } from "../revalidate";

/**
 * The Board of Directors.
 *
 * Order is explicit rather than alphabetical: the board is listed by office —
 * Chairperson, Vice Chairperson, Executive Director, Secretary, then advisors —
 * and that sequence is meaningful.
 *
 * Portraits are cut-outs on a transparent background in the supplied set. A
 * photograph with its background still on will look wrong in the circle, which
 * is what the note on the field says.
 */
export const Board: CollectionConfig = {
  slug: "board",
  // Payload pluralises the slug for the menu; "Boards" is not a thing.
  labels: { singular: "Board member", plural: "Board of Directors" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "role", "order"],
    group: "People",
    description: "Board of Directors, in the order they should appear.",
  },
  hooks: revalidates("board"),
  access: { read: () => true },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      admin: {
        description:
          "As it should appear, including any honorific — e.g. \"Fr. Pierre Celestin NGOBOKA (PhD)\".",
      },
    },
    { name: "role", type: "text", required: true, admin: { description: "e.g. Chairperson." } },
    {
      name: "order",
      type: "number",
      required: true,
      admin: {
        position: "sidebar",
        description: "Lower numbers first. Chairperson is 1.",
      },
    },
    {
      name: "portrait",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: {
        description:
          "A square portrait with the background removed. It is shown in a circle, so anything left behind the person will show.",
      },
    },
  ],
};
