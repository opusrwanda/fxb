import type { GlobalConfig } from "payload";

/**
 * The details that appear on every page.
 *
 * A global rather than a collection: there is one office address and one phone
 * number, so offering an "add another" button would be wrong.
 *
 * The vision and mission are here rather than hard-coded because they are the
 * two sentences most likely to be revised by a board, and both currently sit in
 * a TypeScript file. `visionEmphasis` keeps the three phrases the deck sets in
 * capitals, so the site can stress them without a second, taggable copy of the
 * sentence drifting out of step with the first.
 */
export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site details",
  admin: {
    group: "Settings",
    description: "Address, phone, email, social links, vision and mission.",
  },
  access: { read: () => true },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Contact",
          fields: [
            { name: "email", type: "email", required: true },
            { name: "phone", type: "text", required: true, admin: { description: "As displayed, e.g. +250 780 925 908." } },
            { name: "phoneHref", type: "text", required: true, admin: { description: "For the tap-to-call link, no spaces: +250780925908." } },
            { name: "addressLine", type: "text", required: true },
            { name: "addressDistrict", type: "text", required: true },
            { name: "addressCountry", type: "text", required: true },
            { name: "officeHours", type: "text", required: true },
            {
              name: "mapUrl",
              type: "text",
              required: true,
              admin: { description: "Google Maps share link, used by the \"Get directions\" button." },
            },
            {
              name: "mapEmbedUrl",
              type: "textarea",
              required: true,
              admin: {
                description:
                  "From Google Maps: Share > Embed a map > copy the src=\"...\" address only. This pins the exact office rather than guessing from the address.",
              },
            },
          ],
        },
        {
          label: "Vision & mission",
          fields: [
            { name: "vision", type: "textarea", required: true },
            {
              name: "visionEmphasis",
              type: "array",
              admin: {
                description:
                  "The phrases to stress in the vision, exactly as they appear in it. Each one is shown at full strength against the words around it.",
              },
              fields: [{ name: "phrase", type: "text", required: true }],
            },
            { name: "mission", type: "textarea", required: true },
          ],
        },
        {
          label: "Social",
          fields: [
            {
              name: "socials",
              type: "array",
              fields: [
                {
                  name: "platform",
                  type: "select",
                  required: true,
                  options: ["x", "linkedin", "instagram", "facebook", "youtube"],
                },
                { name: "url", type: "text", required: true },
              ],
            },
            {
              name: "externalSystems",
              type: "array",
              admin: { description: "Systems linked in the header strip and footer, e.g. the Sugira Muryango dashboard." },
              fields: [
                { name: "label", type: "text", required: true },
                { name: "url", type: "text", required: true },
              ],
            },
          ],
        },
      ],
    },
  ],
};
