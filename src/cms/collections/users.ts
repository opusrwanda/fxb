import type { CollectionConfig } from "payload";

/**
 * Who can sign in to /staff.
 *
 * Payload handles the password hashing, sessions and reset flow; `auth: true`
 * is the whole of it. There is no public sign-up — an existing member of staff
 * creates the next one, which is the right shape for a team of a handful of
 * people rather than a membership site.
 */
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "name",
    group: "Settings",
    description: "People who can sign in and edit the website.",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      admin: { description: "Shown in the corner of the editor and on changes." },
    },
    {
      name: "role",
      type: "select",
      defaultValue: "editor",
      options: [
        { label: "Editor — can add and change content", value: "editor" },
        { label: "Administrator — can also manage people", value: "admin" },
      ],
      admin: {
        description:
          "Administrators can add and remove other staff. Everything else is the same.",
      },
    },
  ],
  access: {
    // Only administrators manage the staff list. Everyone signed in can read it,
    // because Payload needs that to show who changed what.
    create: ({ req }) => req.user?.role === "admin",
    delete: ({ req }) => req.user?.role === "admin",
    update: ({ req, id }) =>
      req.user?.role === "admin" || req.user?.id === id,
  },
};
