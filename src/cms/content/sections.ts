import { db, sections } from "@/staff/db";
import { cached } from "./cache";

/**
 * Section copy the team can reword.
 *
 * The eyebrow, the heading and the sentence under it, for the bands that carry
 * the site's argument — the home page rooms and the header of every section
 * landing. These were written into the components, so changing "Four areas of
 * intervention" meant a developer and a deploy.
 *
 * CODE OWNS THE DEFAULTS, THE DATABASE OWNS THE EDITS.
 *
 * The registry below is the list of what exists and what it says out of the
 * box; the `sections` table holds only what somebody has changed. Three things
 * follow from that, and they are the reason it is built this way:
 *
 *   An empty table is a complete site. Nothing has to be seeded, and a fresh
 *   database is not a site full of blank headings.
 *
 *   Resetting is deleting. "Put it back" is removing a row, not remembering
 *   what the words used to be.
 *
 *   The panel can show what it would revert to, because the default is right
 *   here rather than lost the moment somebody typed over it.
 *
 * Adding a section is an entry here and a `getSection` call in the component.
 */

export type SectionCopy = {
  eyebrow?: string;
  heading?: string;
  body?: string;
};

export type SectionDefinition = SectionCopy & {
  /** Which page it appears on, for grouping in the panel. */
  page: string;
  /** What to call it there. */
  label: string;
};

/**
 * Page headers are keyed by their route.
 *
 * `PageHeader` already takes the path, so keying off it means every section
 * landing on the site became editable without touching sixteen page files.
 */
export const headerKey = (path: string) => `header:${path}`;

export const SECTIONS: Record<string, SectionDefinition> = {
  /* ── Home ───────────────────────────────────────────────────────────────── */

  "header:/": {
    page: "Home",
    label: "Hero",
    eyebrow: "A RWANDAN NGO SINCE 1995",
    heading: "Creating a world fit for children.",
    body: "FXB Rwanda empowers vulnerable children, families and communities through integrated interventions in education, health, nutrition, economic empowerment, child protection, HIV prevention, WASH and climate resilience.",
  },
  "home:who-we-are": {
    page: "Home",
    label: "Who We Are",
    eyebrow: "WHO WE ARE",
    heading: "Rooted here since 1995",
    body: "A Rwandan NGO that began in the aftermath of the 1994 Genocide against the Tutsi, and never left.",
  },
  "home:what-we-do": {
    page: "Home",
    label: "What We Do",
    eyebrow: "WHAT WE DO",
    heading: "Four areas of intervention",
    body: "Delivered together through the FXBVillage model, because families never face one problem at a time.",
  },
  "home:our-impact": {
    page: "Home",
    label: "Our Impact",
    eyebrow: "OUR IMPACT",
    heading: "Measured in lives, not activities",
  },

  /* ── Section landings ───────────────────────────────────────────────────── */

  "header:/who-we-are": {
    page: "Who We Are",
    label: "Page header",
    eyebrow: "WHO WE ARE",
    heading: "A local NGO, rooted here since 1995.",
    body: "FXB Rwanda is a registered Rwandan NGO and a member of FXB Global, carrying the legacy of François-Xavier Bagnoud into its fourth decade — across all four provinces and the City of Kigali.",
  },
  "header:/what-we-do": {
    page: "What We Do",
    label: "Page header",
    heading: "Families never face one problem at a time.",
  },
  "header:/our-impact": {
    page: "Our Impact",
    label: "Page header",
    heading: "Creating lasting change through resilient communities.",
    body: "For more than three decades, FXB Rwanda has worked alongside vulnerable children, families and communities to address the root causes of poverty and vulnerability.",
  },
  "header:/get-involved": {
    page: "Get Involved",
    label: "Page header",
    heading: "Together, we can create lasting change.",
    body: "Sustainable development requires collaboration. Meaningful and lasting impact is achieved when communities, governments, donors, institutions, businesses and development organisations work together toward a shared vision.",
  },
  "header:/contact": {
    page: "Contact",
    label: "Page header",
    eyebrow: "CONTACT",
    heading: "Let's connect",
    body: "Whether you have a question, would like to partner with us, make a donation, explore career opportunities, or simply learn more about our work, we would be delighted to hear from you.",
  },
  "header:/get-involved/careers": {
    page: "Get Involved",
    label: "Careers header",
    eyebrow: "CAREERS",
  },
  "header:/get-involved/donate": {
    page: "Get Involved",
    label: "Donate header",
    eyebrow: "DONATE",
    heading: "Your gift changes lives",
    body: "Every child deserves the opportunity to grow up healthy, safe, educated and full of hope. By donating to FXB Rwanda, you become part of a lasting solution.",
  },
  "header:/get-involved/partners": {
    page: "Get Involved",
    label: "Partner With Us header",
    eyebrow: "PARTNER WITH US",
    heading: "Together, we can create lasting change",
    body: "At FXB Rwanda, we believe that meaningful and lasting impact is achieved when communities, governments, donors, institutions, businesses and development organisations work together toward a shared vision.",
  },
  "header:/get-involved/procurement": {
    page: "Get Involved",
    label: "Procurement header",
    eyebrow: "PROCUREMENT",
    heading: "Procurement opportunities",
    body: "FXB Rwanda is committed to transparent, fair and competitive procurement. All opportunities are published here in line with our procurement policies.",
  },
  "header:/news-insights/news": {
    page: "News & Insights",
    label: "Latest News header",
    eyebrow: "LATEST NEWS",
    heading: "News from FXB Rwanda",
    body: "Keep up with the latest developments: announcements, programme updates, partnership news, project launches, achievements and other organisational milestones.",
  },
  "header:/news-insights/stories": {
    page: "News & Insights",
    label: "Stories header",
    eyebrow: "STORIES",
    heading: "People, not projects",
    body: "Behind every programme is a story of hope, resilience and transformation. Discover how the lives of children, families and communities are changing through the support of FXB Rwanda and its partners.",
  },
  "header:/news-insights/publications": {
    page: "News & Insights",
    label: "Publications header",
    eyebrow: "PUBLICATIONS",
    heading: "Reports, research and policy",
    body: "Access reports, research, policy documents, brochures and other publications that showcase our work, impact and learning.",
  },
  "header:/news-insights/newsletters": {
    page: "News & Insights",
    label: "Newsletters header",
    eyebrow: "NEWSLETTERS",
    heading: "Four times a year",
    body: "Our quarterly newsletter gathers the districts, the programmes and the people in one place.",
  },
  "header:/our-impact/media-gallery": {
    page: "Our Impact",
    label: "Media Gallery header",
    eyebrow: "MEDIA GALLERY",
    heading: "The work, as photographed",
  },
};

/**
 * Every override, as a map.
 *
 * One query for the whole site rather than one per section: a page renders
 * several of these and they would otherwise be several round trips for a table
 * that is a handful of short rows.
 */
const getOverrides = cached(
  "sections",
  "sections",
  async (): Promise<Record<string, SectionCopy>> => {
    const rows = await db
      .select({
        key: sections.key,
        eyebrow: sections.eyebrow,
        heading: sections.heading,
        body: sections.body,
      })
      .from(sections);

    const map: Record<string, SectionCopy> = {};
    for (const row of rows) {
      map[row.key] = {
        // Empty is treated as unset. A field cleared in the panel means "go
        // back to the default", which is what somebody clearing it expects —
        // and it stops a stray backspace publishing a blank heading.
        eyebrow: row.eyebrow?.trim() || undefined,
        heading: row.heading?.trim() || undefined,
        body: row.body?.trim() || undefined,
      };
    }
    return map;
  },
);

/**
 * One section's copy: the default, with anything edited on top.
 *
 * `fallback` is for the sections whose default lives in the page that renders
 * them rather than in the registry — `PageHeader` passes the props it was
 * given, so an entry with no `heading` here still shows the right words.
 */
export async function getSection(
  key: string,
  fallback: SectionCopy = {},
): Promise<SectionCopy> {
  const registered = SECTIONS[key] ?? {};
  const edited = (await getOverrides())[key] ?? {};

  return {
    eyebrow: edited.eyebrow ?? registered.eyebrow ?? fallback.eyebrow,
    heading: edited.heading ?? registered.heading ?? fallback.heading,
    body: edited.body ?? registered.body ?? fallback.body,
  };
}

/** Everything the panel needs: what it says now, and what it would revert to. */
export async function getSectionsForPanel() {
  const edited = await getOverrides();

  return Object.entries(SECTIONS).map(([key, definition]) => ({
    key,
    page: definition.page,
    label: definition.label,
    defaults: {
      eyebrow: definition.eyebrow,
      heading: definition.heading,
      body: definition.body,
    },
    edited: edited[key] ?? {},
  }));
}
