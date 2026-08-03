import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";

import { Board } from "./src/cms/collections/board";
import { Media } from "./src/cms/collections/media";
import { News } from "./src/cms/collections/news";
import { Opportunities } from "./src/cms/collections/opportunities";
import { Partners } from "./src/cms/collections/partners";
import { Programmes } from "./src/cms/collections/programmes";
import { Publications } from "./src/cms/collections/publications";
import { Stories } from "./src/cms/collections/stories";
import { Users } from "./src/cms/collections/users";
import { Impact } from "./src/cms/globals/impact";
import { SiteSettings } from "./src/cms/globals/site-settings";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * The content management system.
 *
 * Everything the team should be able to change without a developer lives here.
 * The site's content used to be TypeScript modules in `src/lib` — which is fine
 * for a build and useless for FXB, because publishing a news item meant editing
 * a file, and a missing comma took the site down.
 *
 * Mounted at `/staff`, not Payload's default `/admin`. It is the team's own
 * word for the people who use it, and it keeps the door off the address every
 * scanner tries first.
 *
 * Two shapes of content, and the distinction matters when adding more:
 *
 *   COLLECTIONS are things there can be many of and which come and go — news,
 *   stories, programmes, board members, partners, publications, vacancies.
 *
 *   GLOBALS are the single documents a site has exactly one of — the contact
 *   details, the impact figures. There is no "add another" for the office
 *   address, so it would be wrong to offer one.
 *
 * Postgres rather than MongoDB: the content is relational — a programme has
 * districts, a publication has a category — and Neon's free tier is enough for
 * a site this size several times over.
 */
export default buildConfig({
  routes: {
    admin: "/staff",
    // The API moves with it. Payload defaults to /api, which the site already
    // uses for its contact and newsletter handlers — a catch-all there would
    // sit directly on top of them.
    api: "/staff/api",
  },

  admin: {
    user: Users.slug,

    // The editor wears the brand. A team signing in to change their own website
    // should see their own organisation, not a piece of software they have
    // never heard of — an unfamiliar login screen is what makes people think
    // they are in the wrong place, or that they are being phished.
    components: {
      graphics: {
        Logo: "/src/cms/branding/logo#Logo",
        Icon: "/src/cms/branding/icon#Icon",
      },
    },

    meta: {
      titleSuffix: " — FXB Rwanda",
      icons: [{ rel: "icon", type: "image/png", url: "/icon.png" }],
      openGraph: { title: "FXB Rwanda", description: "Website editor" },
    },
  },

  collections: [
    News,
    Stories,
    Programmes,
    Publications,
    Board,
    Partners,
    Opportunities,
    Media,
    Users,
  ],

  globals: [SiteSettings, Impact],

  editor: lexicalEditor({}),

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
    // Tables are created from the collections above on first run in
    // development. Production uses the generated migrations instead, so a
    // deploy can never quietly reshape a live table.
    push: process.env.NODE_ENV !== "production",
  }),

  secret: process.env.PAYLOAD_SECRET || "",

  typescript: {
    outputFile: path.resolve(dirname, "src/cms/payload-types.ts"),
  },

  // The team writes in English; the brief's own copy is a mix of English and
  // French, and two news items are French. Localisation is a bigger decision
  // than a config flag, so it is deliberately not switched on here.
  telemetry: false,
});
