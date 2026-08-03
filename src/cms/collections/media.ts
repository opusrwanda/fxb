import type { CollectionConfig } from "payload";

/**
 * Every photograph and file the team uploads.
 *
 * One collection rather than a field on each thing that needs a picture, so an
 * image uploaded for a news item can be reused on a programme without being
 * uploaded twice.
 *
 * `alt` is required, and that is not bureaucracy. This site photographs
 * vulnerable households; a screen reader user gets nothing at all from a
 * photograph with no description, and the person best placed to describe it is
 * whoever just chose it.
 *
 * The existing 43 programme photographs stay on Bunny and are not migrated
 * here — they are already optimised and referenced by id. This is for
 * everything added from now on.
 */
export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    group: "Library",
    description: "Photographs and files. Upload once, use anywhere.",
  },
  access: { read: () => true },
  upload: {
    // Sizes the site actually asks for, so the browser is never sent a 4MB
    // camera file to display at 400px.
    imageSizes: [
      { name: "thumbnail", width: 480, height: undefined, position: "centre" },
      { name: "card", width: 900, height: undefined, position: "centre" },
      { name: "wide", width: 1800, height: undefined, position: "centre" },
    ],
    mimeTypes: ["image/*", "application/pdf"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      admin: {
        description:
          "Describe what is in the picture, for people using a screen reader. E.g. \"A woman standing in the shop she runs\". Leave out \"photo of\".",
      },
    },
    {
      name: "credit",
      type: "text",
      admin: { description: "Photographer or source, if one should be shown." },
    },
  ],
};
