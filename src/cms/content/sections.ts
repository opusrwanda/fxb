import { eq } from "drizzle-orm";

import { db, media, sections } from "@/staff/db";
import type { SectionItem } from "@/staff/db/schema";
import { cached } from "./cache";
import { image, type Img } from "./image";
import { SECTORS } from "@/lib/sectors";
import { journey, pillars, principles } from "@/lib/fxbvillage";
import { PILLAR_ICONS } from "@/lib/fxbvillage-icons";

export type { SectionItem };

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
 *
 * THE ORDER OF THIS OBJECT IS THE ORDER OF THE PANEL, so it is the order of the
 * page. Somebody arrives at Page sections having just looked at What We Do and
 * wanting to change the line over the photograph between The Challenge and the
 * FXBVillage Model — and they look for it between The Challenge and the
 * FXBVillage Model. It used to be grouped by kind instead: every page header,
 * then every band, then every photograph band, so a band's neighbours in the
 * panel were nothing like its neighbours on the page and the one somebody came
 * for was at the bottom of a fold of sixteen. Each group below now reads top to
 * bottom exactly as its page does.
 */

export type SectionCopy = {
  eyebrow?: string;
  heading?: string;
  body?: string;
};

/** A section as the site renders it: its words, its background, its blocks. */
export type Section = SectionCopy & {
  /** A photograph behind it, where one has been chosen. */
  image: Img | null;
  /** The repeated blocks — the cards, the pillars, the steps. */
  items: SectionItem[];
};

export type SectionDefinition = SectionCopy & {
  /** Which page it appears on, for grouping in the panel. */
  page: string;
  /** What to call it there. */
  label: string;
  /**
   * The blocks this section ships with.
   *
   * Present only on the sections that have a repeated list. Its absence is
   * what tells the panel not to offer an item editor — a section with no list
   * should not grow an empty "add a card" form nobody can use.
   */
  items?: SectionItem[];
  /**
   * What the section illustrates itself with out of the box, as a path under
   * `/img` or a CDN URL. Choosing a picture in the panel replaces it.
   */
  image?: string;
  /**
   * The fields the page writes for itself, so the panel can say why they are
   * blank rather than showing an empty box next to text a reader can plainly
   * see on the site.
   *
   * "22 projects across 14 districts" is counted out of the programmes table on
   * every request, and the Careers heading depends on whether anything is open.
   * There is no default to show for either — but there is a reason, and a
   * reason is what stops somebody concluding the panel has lost their words.
   * Typing here still wins, for anybody who would rather have a fixed sentence.
   */
  computed?: ("eyebrow" | "heading" | "body")[];
  /**
   * Which of the three copy fields this band actually draws.
   *
   * All three by default. Named where a band draws fewer, because a field the
   * panel offers and the site ignores is the same lie as a picker that changes
   * nothing — somebody types a heading, saves, and the page does not move.
   *
   * An empty list means the band has no copy of its own at all: the sectors run
   * as a bare row inside Our Approach, under that section's heading. A
   * photograph band names only `heading`, which is its one line over the
   * picture.
   */
  offers?: ("eyebrow" | "heading" | "body")[];
  /**
   * The introduction is more than one paragraph.
   *
   * Several bands open with a lead sentence and carry on for another paragraph
   * or two, and those follow-on paragraphs were literals in the component —
   * so the Introduction field reached the first sentence of a block of text and
   * none of the rest of it, which is worse than not offering the field at all.
   *
   * One field still, split on blank lines. A second and third column in the
   * table would be a schema change for the handful of bands that need them, and
   * a panel where some sections have three text boxes and most have one; a
   * blank line is a convention somebody can see in the box itself.
   */
  prose?: true;
};

/**
 * An introduction, as the paragraphs it is made of.
 *
 * Blank lines separate them — one newline is a wrap, two is a new paragraph,
 * which is how every text box on the internet behaves. Empty in, empty out, so
 * a band with nothing written renders nothing rather than one empty `<p>`.
 */
export function paragraphs(body?: string): string[] {
  return (body ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/**
 * Page headers are keyed by their route.
 *
 * `PageHeader` already takes the path, so keying off it means every section
 * landing on the site became editable without touching sixteen page files.
 */
export const headerKey = (path: string) => `header:${path}`;

/**
 * The route whose banner photograph a header section owns, or null.
 *
 * The banners live in `page_headers` keyed by route, and every page header on
 * the site is a section keyed by the same route — so the two are one row of the
 * panel rather than two pages that have to be kept in step. That is what let
 * the separate Page banners screen go: a banner is part of the page header, and
 * the page header is edited here.
 *
 * Home included. Its hero was the one opening block on the site nobody could
 * change the picture of — the footage is on the CDN and the poster is a file in
 * the repo, so replacing it meant an upload and a deploy. A row for `/` is what
 * lets the team put their own plate behind it; leaving it empty is what keeps
 * the shipped footage, which is why the home page looks the same until somebody
 * chooses something.
 */
export function bannerPath(key: string): string | null {
  return key.startsWith("header:") ? key.slice("header:".length) : null;
}

export const SECTIONS: Record<string, SectionDefinition> = {

  /* ── Home — the rooms, top to bottom ───────────────────────────────── */

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
    prose: true,
    body: `A Rwandan NGO that began in the aftermath of the 1994 Genocide against the Tutsi, and never left.

FXB International came to Rwanda in 1995 to walk with vulnerable children, widows and families on the road back to self-reliance. The FXBVillage model followed in 2000, and in 2012 we became a registered Rwandan NGO in our own right. Today we work across all four provinces and the City of Kigali — a local organisation carrying a global name, and the legacy of François-Xavier Bagnoud, into its fourth decade.`,
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

  /* ── Who We Are ────────────────────────────────────────────────────── */

  "header:/who-we-are": {
    page: "Who We Are",
    label: "Page header",
    eyebrow: "WHO WE ARE",
    heading: "A local NGO, rooted here since 1995.",
    body: "FXB Rwanda is a registered Rwandan NGO and a member of FXB Global, carrying the legacy of François-Xavier Bagnoud into its fourth decade — across all four provinces and the City of Kigali.",
  },

  "who-we-are:story": {
    page: "Who We Are",
    label: "Our Story band",
    eyebrow: "OUR STORY",
    heading: "Four decades, one promise",
    body: "From a life lost on a rescue mission in Mali to a Rwandan NGO working in every province — the through line has never changed.",
  },

  "who-we-are:vision": {
    page: "Who We Are",
    label: "Vision, Mission & Values band",
    eyebrow: "VISION, MISSION & VALUES",
  },

  "who-we-are:where-we-work": {
    page: "Who We Are",
    label: "Where We Work band",
    eyebrow: "WHERE WE WORK",
    body: "Across all four provinces and the City of Kigali. Point at a district to see what runs there, or at a project to see where it runs.",
    // "14 districts, 9 projects" — read off the programmes, not typed.
    computed: ["heading"],
  },

  "who-we-are:leadership": {
    page: "Who We Are",
    label: "Leadership band",
    eyebrow: "LEADERSHIP",
    heading: "Board of Directors",
  },

  /* ── What We Do ────────────────────────────────────────────────────── */

  "header:/what-we-do": {
    page: "What We Do",
    label: "Page header",
    heading: "Families never face one problem at a time.",
    // "Across 13 districts, our 6 programmes work on…" — counted off the
    // programmes, so it is right the day a project ends.
    computed: ["body"],
  },

  "what-we-do:approach": {
    page: "What We Do",
    label: "Our Approach band",
    eyebrow: "OUR APPROACH",
    heading: "Empowering communities through integrated development",
    body: "At FXB Rwanda, we believe that lasting change happens when families and communities are equipped with the knowledge, skills, and opportunities they need to thrive.",
  },

  "what-we-do:sectors": {
    page: "What We Do",
    label: "Sectors list (under Our Approach)",
    offers: [],
    items: SECTORS.map((sector) => ({ title: sector })),
  },

  "what-we-do:challenge": {
    page: "What We Do",
    label: "The Challenge band",
    eyebrow: "THE CHALLENGE",
    heading: "The challenge of child poverty",
    prose: true,
    body: `Among the most disadvantaged groups in society, children are particularly vulnerable to the many consequences of poverty that affect families and communities. Income insecurity, hunger, poor health, marginalisation, illiteracy, and the lack of sanitation and adequate housing are both causes and consequences of poverty, pulling families into a downward spiral of deprivation.

Poverty experienced by children, even for short periods, can leave lasting marks throughout their lives. In the most severe situations, some do not survive. Those who do may suffer from early childhood onward, from malnutrition, insecurity, and multiple forms of deprivation, with lasting effects on their health and cognitive development. These consequences compromise their potential in adulthood and weaken the well-being of future generations.`,
  },

  "photo:/what-we-do/challenge": {
    page: "What We Do",
    label: "Photograph band — after The Challenge",
    offers: ["heading"],
    heading: "Poverty arrives in every part of a life at once.",
  },

  "what-we-do:model-intro": {
    page: "What We Do",
    label: "FXBVillage Model band",
    eyebrow: "THE FXBVILLAGE MODEL",
    heading: "A holistic route out of poverty",
    // Three columns rather than a lead and its follow-on: this band sets its
    // paragraphs side by side, so all three carry the same weight.
    prose: true,
    body: `The FXBVillage model is a holistic and integrated approach designed to enable families to sustainably move out of poverty, by giving parents the means to protect and raise their children. Economic empowerment is its central driver of change.

However, economic support alone is not enough to ensure a lasting exit from poverty. The model therefore combines economic empowerment with access to basic services and the realisation of fundamental rights, while placing the improvement of children's and adults' quality of life at the heart of its action.

By acting simultaneously on economic, social, and human dimensions, the FXBVillage model fosters lasting family transformation, improves children's wellbeing, and helps break the intergenerational cycle of poverty.`,
  },

  "photo:/what-we-do/journey": {
    page: "What We Do",
    label: "Photograph band — before the Journey",
    offers: ["heading"],
    heading: "Three years, and a household that no longer needs us.",
  },

  "what-we-do:journey": {
    page: "What We Do",
    label: "Transformation Journey band",
    eyebrow: "TRANSFORMATION JOURNEY",
    heading: "36 months to change a life, sustainably",
    body: "A complete 36-month journey toward dignity, access to fundamental rights, and lasting change for children and families.",
    // The step number is the position in the list, so it is not a field
    // somebody can get out of step with the order.
    items: journey.map((phase) => ({ title: phase.period, body: phase.body })),
  },

  "what-we-do:principles": {
    page: "What We Do",
    label: "Guiding Principles band",
    eyebrow: "GUIDING PRINCIPLES",
    heading: "Built on three principles",
    body: "At FXB Rwanda, we believe that every family has the potential to overcome poverty when provided with the right opportunities, knowledge, and support.",
    items: principles.map((principle) => ({
      title: principle.title,
      body: principle.body,
    })),
  },

  "photo:/what-we-do/pillars": {
    page: "What We Do",
    label: "Photograph band — before the Pillars",
    offers: ["heading"],
    heading: "A business of one's own is what the last year is for.",
  },

  "what-we-do:pillars": {
    page: "What We Do",
    label: "The Pillars band",
    eyebrow: "THE PILLARS",
    heading: "Five pillars, delivered together",
    body: "The model integrates a set of mutually reinforcing pillars that work together to improve the overall well-being of families.",
    items: pillars.map((pillar) => ({
      title: pillar.title,
      body: pillar.lead,
      icon: PILLAR_ICONS[pillar.id],
      points: pillar.interventions.map((intervention) => ({
        title: intervention.name,
        body: intervention.body,
      })),
    })),
  },

  "what-we-do:why-it-works": {
    page: "What We Do",
    label: "Why It Works band",
    eyebrow: "WHY IT WORKS",
    heading: "Integrated, and people-centred",
    prose: true,
    body: `The strength of the FXBVillage Model lies in its integrated and people-centred approach.

Instead of addressing one challenge in isolation, the model recognises that lasting change requires coordinated action across multiple sectors. By empowering families with knowledge, resources, and opportunities, the model creates a foundation for long-term resilience and sustainable development.

This holistic approach not only improves immediate living conditions but also enables communities to continue progressing long after project interventions have ended.`,
  },

  "what-we-do:projects-delivered": {
    page: "What We Do",
    label: "FXBVillage Projects band",
    eyebrow: "FXBVILLAGE PROJECTS",
    body: "As of now, 54 FXBVillage projects have been implemented, leaving thousands of families resilient from poverty.",
  },

  /**
   * The band's words only. The cards under it are their own collection —
   * Areas of intervention in the panel — because they carry a photograph, an
   * icon, an anchor and a category, none of which a section block has. Two
   * editors for the same four cards would be the worse answer.
   */
  "what-we-do:areas": {
    page: "What We Do",
    label: "Areas of Intervention band",
    eyebrow: "AREAS OF INTERVENTION",
    heading: "Four areas, one household",
    computed: ["body"],
  },

  /**
   * The two project listings.
   *
   * Current Projects is registered without a `body` and marked `computed`:
   * theirs is counted rather than written — "22 projects across 14 districts"
   * is read off the programmes table on every request — and a default here
   * would freeze that sentence at whatever the numbers were the day it was
   * typed.
   */
  "header:/what-we-do/current-projects": {
    page: "What We Do",
    label: "Current Projects header",
    eyebrow: "CURRENT PROJECTS",
    heading: "What we are running today",
    computed: ["body"],
  },

  "header:/what-we-do/phased-out-projects": {
    page: "What We Do",
    label: "Phased-out Projects header",
    eyebrow: "PHASED-OUT PROJECTS",
    heading: "Work that has run its course",
    body: "A project ending is the point of the model. Families exit when they no longer need us — with income, savings, school fees paid and health cover in place.",
  },

  /* ── Our Impact ────────────────────────────────────────────────────── */

  "header:/our-impact": {
    page: "Our Impact",
    label: "Page header",
    heading: "Creating lasting change through resilient communities.",
    body: "For more than three decades, FXB Rwanda has worked alongside vulnerable children, families and communities to address the root causes of poverty and vulnerability.",
  },

  "our-impact:reach": {
    page: "Our Impact",
    label: "Results at a Glance band",
    eyebrow: "RESULTS AT A GLANCE",
    heading: "Our reach since 2012",
    body: "Reach is counted per area, so a household supported in two of them is counted in both. The total is reported separately.",
  },

  "header:/our-impact/stories": {
    page: "Our Impact",
    label: "Impact Stories header",
    eyebrow: "IMPACT STORIES",
    heading: "People, not projects",
    body: "Behind every programme is a story of hope, resilience and transformation. Discover how the lives of children, families and communities are changing through the support of FXB Rwanda and its partners.",
  },

  /* ── News & Insights ───────────────────────────────────────────────── */

  "header:/news-insights/news": {
    page: "News & Insights",
    label: "Latest News header",
    eyebrow: "LATEST NEWS",
    heading: "News from FXB Rwanda",
    body: "Keep up with the latest developments: announcements, programme updates, partnership news, project launches, achievements and other organisational milestones.",
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

  "header:/news-insights/media-gallery": {
    page: "News & Insights",
    label: "Media Gallery header",
    eyebrow: "MEDIA GALLERY",
    heading: "The work, as photographed",
    // "163 photographs from our programmes across Rwanda."
    computed: ["body"],
  },

  /* ── Get Involved ──────────────────────────────────────────────────── */

  "header:/get-involved": {
    page: "Get Involved",
    label: "Page header",
    heading: "Together, we can create lasting change.",
    body: "Sustainable development requires collaboration. Meaningful and lasting impact is achieved when communities, governments, donors, institutions, businesses and development organisations work together toward a shared vision.",
  },

  "get-involved:ways-in": {
    page: "Get Involved",
    label: "Four ways in band",
    heading: "Four ways in",
    prose: true,
    body: `For more than three decades, FXB Rwanda has partnered with local and international stakeholders to design and implement evidence-based programmes that improve the lives of vulnerable children, families and communities across Rwanda.

Through strong partnerships, we combine resources, expertise, innovation and local knowledge to create solutions that strengthen resilience and promote sustainable development. Together, we can build stronger communities and create a world fit for children.`,
  },

  "photo:/get-involved": {
    page: "Get Involved",
    label: "Photograph band",
    offers: ["heading"],
    heading: "There is more than one way to be part of this.",
  },

  "header:/get-involved/partners": {
    page: "Get Involved",
    label: "Partner With Us header",
    eyebrow: "PARTNER WITH US",
    heading: "Together, we can create lasting change",
    body: "At FXB Rwanda, we believe that meaningful and lasting impact is achieved when communities, governments, donors, institutions, businesses and development organisations work together toward a shared vision.",
  },

  "photo:/get-involved/partners": {
    page: "Get Involved",
    label: "Partner With Us photograph band",
    offers: ["heading"],
    heading: "Every project on this page is delivered with somebody.",
  },

  "header:/get-involved/careers": {
    page: "Get Involved",
    label: "Careers header",
    eyebrow: "CAREERS",
    // Both depend on whether anything is open — "Join our team" when there is,
    // "Build a career with purpose" when there is not.
    computed: ["heading", "body"],
  },

  "photo:/get-involved/careers": {
    page: "Get Involved",
    label: "Careers photograph band",
    offers: ["heading"],
    heading: "The work is done by people who live where it happens.",
  },

  "header:/get-involved/procurement": {
    page: "Get Involved",
    label: "Procurement header",
    eyebrow: "PROCUREMENT",
    heading: "Procurement opportunities",
    body: "FXB Rwanda is committed to transparent, fair and competitive procurement. All opportunities are published here in line with our procurement policies.",
  },

  "photo:/get-involved/procurement": {
    page: "Get Involved",
    label: "Procurement photograph band",
    offers: ["heading"],
    heading: "What we buy is bought to be used in a district.",
  },

  "header:/get-involved/donate": {
    page: "Get Involved",
    label: "Donate header",
    eyebrow: "DONATE",
    heading: "Your gift changes lives",
    body: "Every child deserves the opportunity to grow up healthy, safe, educated and full of hope. By donating to FXB Rwanda, you become part of a lasting solution.",
  },

  "photo:/get-involved/donate": {
    page: "Get Involved",
    label: "Donate photograph band",
    offers: ["heading"],
    heading: "Three years of support, and a household that no longer needs it.",
  },

  /* ── Contact ───────────────────────────────────────────────────────── */

  "header:/contact": {
    page: "Contact",
    label: "Page header",
    eyebrow: "CONTACT",
    heading: "Let's connect",
    body: "Whether you have a question, would like to partner with us, make a donation, explore career opportunities, or simply learn more about our work, we would be delighted to hear from you.",
  },

  /* ── Shared bands — used on more than one page ─────────────────────── */

  "band:impact-stories": {
    page: "Shared bands",
    label: "Impact Stories carousel",
    heading: "Behind every programme, a person",
    body: "Programmes are counted in households reached. What they change is only ever visible one household at a time.",
  },

  "band:latest-news": {
    page: "Shared bands",
    label: "Latest News band",
    eyebrow: "NEWS & INSIGHTS",
    heading: "Latest from FXB Rwanda",
  },

  "band:partners": {
    page: "Shared bands",
    label: "Partners band",
    eyebrow: "PARTNERS",
    heading: "None of this was done alone",
    body: "Government institutions, donors and fellow organisations who fund the work, shape it, and deliver it alongside us.",
  },

  "band:newsletter": {
    page: "Shared bands",
    label: "Newsletter signup band",
    eyebrow: "NEWSLETTER",
    heading: "Keep up with the work",
    body: "Our quarterly newsletter gathers the districts, the programmes and the people in one place — stories from the field, project updates and the occasional annual report. Four times a year, no more.",
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
  async (): Promise<Record<string, Override>> => {
    const rows = await db
      .select({ section: sections, photo: media })
      .from(sections)
      .leftJoin(media, eq(sections.imageId, media.id));

    const map: Record<string, Override> = {};
    for (const { section: row, photo } of rows) {
      map[row.key] = {
        // Empty is treated as unset. A field cleared in the panel means "go
        // back to the default", which is what somebody clearing it expects —
        // and it stops a stray backspace publishing a blank heading.
        eyebrow: row.eyebrow?.trim() || undefined,
        heading: row.heading?.trim() || undefined,
        body: row.body?.trim() || undefined,
        imageId: row.imageId,
        image: image(photo),
        // Null and empty differ here — see the column's own note. Null falls
        // through to the list the code ships; an empty array is somebody
        // having removed every block on purpose.
        items: row.items ?? undefined,
      };
    }
    return map;
  },
);

type Override = SectionCopy & {
  /** The chosen row, so the panel can preselect it in the picker. */
  imageId: number | null;
  image: Img | null;
  items?: SectionItem[];
};

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
): Promise<Section> {
  const registered = SECTIONS[key] ?? {};
  const edited = (await getOverrides())[key] ?? {};

  return {
    eyebrow: edited.eyebrow ?? registered.eyebrow ?? fallback.eyebrow,
    heading: edited.heading ?? registered.heading ?? fallback.heading,
    body: edited.body ?? registered.body ?? fallback.body,
    /**
     * The chosen photograph, or the one the section ships with.
     *
     * A default `image` on the registry entry is a path in the repo rather
     * than a library row, so it has no description of its own — the section
     * drawing it knows what it is showing and supplies the alt text. A picture
     * chosen in the panel brings its own, which is why that one wins.
     */
    image:
      edited.image ??
      (registered.image
        ? { url: registered.image, alt: "", width: 1600, height: 900 }
        : null),
    items: edited.items ?? registered.items ?? [],
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
    /**
     * Whether this section has a list to edit at all.
     *
     * The panel offers the item editor only where the code renders one — a
     * section with no cards should not grow an empty "add a card" form that
     * writes rows nothing reads.
     */
    itemsShipped: definition.items ?? null,
    /** Which fields have no default to show because the page counts them. */
    computed: definition.computed ?? [],
    /** Which copy fields this band draws, so the panel offers only those. */
    offers: definition.offers ?? ["eyebrow", "heading", "body"],
    /** Whether its introduction runs to more than one paragraph. */
    prose: definition.prose ?? false,
    edited: edited[key] ?? {},
  }));
}
