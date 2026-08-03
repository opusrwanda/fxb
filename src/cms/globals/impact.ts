import type { GlobalConfig } from "payload";

/**
 * The reach figures.
 *
 * The brief marks every one of these "(Insert updated statistics from
 * MEL/database)", which is exactly why they belong here: they are the numbers
 * most likely to change and the ones a developer has no business being in the
 * loop on. MEL updates them, the site follows.
 *
 * `note` is rendered under the figures. It currently says the figures are being
 * updated for the reporting cycle, and it should be edited rather than removed
 * when they are confirmed — a page of large numbers with no word on where they
 * came from is a weaker claim, not a stronger one.
 */
export const Impact: GlobalConfig = {
  slug: "impact",
  label: "Impact figures",
  admin: {
    group: "Settings",
    description: "The reach figures on the home page and Our Impact.",
  },
  access: { read: () => true },
  fields: [
    {
      name: "figures",
      type: "array",
      required: true,
      minRows: 1,
      admin: { description: "Shown in this order. Four is what the design expects." },
      fields: [
        { name: "label", type: "text", required: true, admin: { description: "e.g. Socio-Economic Strengthening." } },
        {
          name: "value",
          type: "number",
          admin: {
            description:
              "The number only, no commas or plus sign — the site formats it. Leave blank if MEL has not split this figure out yet; it renders without a number rather than with an invented one.",
          },
        },
        { name: "caption", type: "textarea", required: true },
        {
          name: "areas",
          type: "array",
          admin: { description: "Revealed when someone points at the figure." },
          fields: [{ name: "item", type: "text", required: true }],
        },
        {
          name: "photo",
          type: "upload",
          relationTo: "media",
          admin: { description: "Sits behind the figure on Our Impact." },
        },
      ],
    },
    {
      name: "projectsDelivered",
      type: "number",
      required: true,
      admin: { description: "FXBVillage projects delivered to date. Currently 54." },
    },
    {
      name: "note",
      type: "textarea",
      admin: { description: "Shown under the figures — where they come from and when they were last updated." },
    },
  ],
};
