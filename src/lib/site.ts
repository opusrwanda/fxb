/**
 * Site-wide constants drawn from the content structure document
 * (OK_FXB_Rwanda_Revamped_Website_Content_Structure.docx, 23 July 2026) and
 * the Brand Guiding Tool (24 July 2026).
 *
 * The navigation and the brand identity live here. The contact details, the
 * vision and mission and the social links moved to the CMS — read them with
 * `getSiteDetails()` from `src/cms/content/settings.ts`, which returns them
 * merged with `brand` below.
 */

/**
 * Who the organisation is, as opposed to how to reach it.
 *
 * Deliberately not in the CMS. Changing any of these would be a rebrand, not an
 * edit, and it would need the logo files, the metadata and the domain to change
 * with it — so putting them behind a text field would offer the team a change
 * they cannot actually make from there.
 */
export const brand = {
  name: "FXB Rwanda",
  legalName: "Francois Xavier Bagnoud",
  linktree: "https://linktr.ee/fxbrwanda",
} as const;

/**
 * ───────────────────────────────────────────────────────────────────────────
 *  SEED INPUT ONLY. THE SITE NO LONGER READS THIS.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * These were the site's contact details until they moved into the Site details
 * global. Nothing reads them now — the seed script that did was retired, and
 * production is reached by `scripts/migrate-from-payload.ts`, which reads
 * Payload's database rather than this file. Editing them here changes nothing
 * that anybody can see. Edit `/staff` instead.
 *
 * `brand` above is the live export in this file, not this.
 */
export const org = {
  name: "FXB Rwanda",
  legalName: "Francois Xavier Bagnoud",
  endorsement: "Member of FXB Global",
  vision: "Empowered and resilient communities shaping their own future.",
  /**
   * The three phrases the client sets in capitals when they write the vision
   * out: EMPOWERED and RESILIENT COMMUNITIES shaping their OWN FUTURE.
   *
   * Held as phrases rather than as a pre-marked-up string so there is still
   * exactly one copy of the wording. A second, tagged version of the sentence
   * would be a second thing to keep in step, and the two would drift the first
   * time anyone edited one of them.
   *
   * Capitals are the deck's way of marking emphasis, not a request to shout:
   * three all-caps runs inside a 40px display line read as a legal notice. The
   * section renders them at full weight and full white against the connective
   * words, which says the same thing in the register the rest of the site uses.
   */
  visionEmphasis: ["Empowered", "resilient communities", "own future"],
  mission:
    "To strengthen families, children and youth resilience through holistic interventions that create pathways from vulnerability to dignity and self-reliance.",
  email: "info@fxbrwanda.org",
  phone: "+250 780 925 908",
  phoneHref: "+250780925908",
  address: {
    line: "FXB Rwanda Headquarters, Ruyenzi",
    district: "Kamonyi District",
    country: "Rwanda",
  },
  mapUrl: "https://maps.app.goo.gl/C6Mekkrr3KqzMuj78",
  /**
   * The embed URL, taken from Google Maps' own Share > Embed a map.
   *
   * It carries the place id — `0x19dca5c9d779b0f5:0x3a2052323f9490d4` — so the
   * pin lands on FXB Rwanda Headquarters with its own label. The embed used to
   * search on the address string instead, which asked Google to guess at
   * "Ruyenzi, Kamonyi District" every time and drop the pin wherever that
   * landed. A head office is somewhere people are trying to drive to.
   *
   * No API key, and no billing account tied to it. `mapUrl` above is the same
   * place as a short link, for the "get directions" action.
   */
  mapEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1993.729852895924!2d29.9884125!3d-1.9702029!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca5c9d779b0f5%3A0x3a2052323f9490d4!2sFXB%20Rwanda%20Headquarters!5e0!3m2!1sen!2srw!4v1785744356502!5m2!1sen!2srw",
  linktree: "https://linktr.ee/fxbrwanda",
  officeHours: "Monday – Friday, 8:00 AM – 5:00 PM",
} as const;

export type NavChild = { label: string; href: string };
export type NavItem = {
  label: string;
  href: string;
  children?: NavChild[];
  /**
   * One sentence, shown beside the children in the header's hover panel.
   *
   * It is what the section is, not a tagline — somebody reading it is deciding
   * whether this is the branch they want, and "Our work, our way" does not help
   * them decide. Only sections with children need one; Contact has no panel.
   */
  blurb?: string;
};

export const primaryNav: NavItem[] = [
  {
    label: "Who We Are",
    href: "/who-we-are",
    blurb:
      "A Rwandan NGO since 1995 — where we came from, what we stand for, and who leads the work.",
    children: [
      { label: "Our Story", href: "/who-we-are#story" },
      { label: "Vision, Mission & Values", href: "/who-we-are#vision" },
      { label: "Where We Work", href: "/who-we-are#where-we-work" },
      { label: "Leadership", href: "/who-we-are#leadership" },
    ],
  },
  {
    label: "What We Do",
    href: "/what-we-do",
    blurb:
      "The FXBVillage model and the eight areas it works across, from the projects running now to the ones already handed over.",
    children: [
      { label: "The FXBVillage Model", href: "/what-we-do#fxbvillage-model" },
      { label: "Areas of Intervention", href: "/what-we-do#areas" },
      { label: "Current Projects", href: "/what-we-do/current-projects" },
      { label: "Phased-out Projects", href: "/what-we-do/phased-out-projects" },
    ],
  },
  {
    label: "Our Impact",
    href: "/our-impact",
    blurb:
      "What the work has changed, measured in lives rather than activities — the figures, the people behind them, and the reports that evidence it.",
    /**
     * Three entries, and none of them repeated next door.
     *
     * This menu and News & Insights used to overlap on three of five items —
     * Publications and Media Gallery appeared in both, and the same three
     * stories were listed as "Success Stories" here and "Stories" there. A
     * reader cannot tell two menus apart when half of each is the other, and
     * the practical effect was that nobody could say which section anything
     * lived in.
     *
     * So the two were split on what the reader is actually after. Our Impact
     * answers "what changed": the figures, the people it changed for, and the
     * reports that evidence it. News & Insights answers "what is new": what we
     * have said, published, sent and photographed.
     *
     * Annual Reports is the one deliberate cross-link left. The reports are
     * publications and live on that page, but somebody looking for evidence of
     * impact looks here — so the entry points across rather than duplicating
     * the listing.
     */
    children: [
      { label: "Results at a Glance", href: "/our-impact#results" },
      { label: "Impact Stories", href: "/our-impact/stories" },
      { label: "Annual Reports", href: "/news-insights/publications#annual-reports" },
    ],
  },
  {
    label: "News & Insights",
    href: "/news-insights",
    blurb:
      "Programme news, everything we publish, the quarterly newsletter, and the work as photographed.",
    children: [
      { label: "Latest News", href: "/news-insights/news" },
      { label: "Newsletters", href: "/news-insights/newsletters" },
      { label: "Publications", href: "/news-insights/publications" },
      { label: "Media Gallery", href: "/news-insights/media-gallery" },
    ],
  },
  {
    label: "Get Involved",
    href: "/get-involved",
    blurb:
      "Fund the work, deliver it alongside us, join the team, or bid for a contract.",
    children: [
      { label: "Partner With Us", href: "/get-involved/partners" },
      { label: "Careers", href: "/get-involved/careers" },
      { label: "Procurement", href: "/get-involved/procurement" },
      { label: "Donate", href: "/get-involved/donate" },
    ],
  },
  { label: "Contact", href: "/contact" },
];

/** SEED INPUT ONLY — external systems now live in the Site details global. */
export const externalSystems: NavChild[] = [
  { label: "Sugira Muryango Dashboard", href: "https://sugiramuryango.fxbrwanda.org" },
  { label: "POMC", href: "http://185.194.218.11" },
];

/** SEED INPUT ONLY — the social links now live in the Site details global. */
export const socials = [
  { label: "X", href: "https://x.com/fxbrwanda", icon: "x" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/fxb-rwanda", icon: "linkedin" },
  { label: "Instagram", href: "https://instagram.com/fxbrwanda", icon: "instagram" },
  { label: "Facebook", href: "https://facebook.com/fxbrwanda", icon: "facebook" },
  { label: "YouTube", href: "https://youtube.com/@fxbrwanda", icon: "youtube" },
] as const;

/**
 * Routes whose page opens with a `<Hero>`, and where the header is therefore
 * allowed to server-render in its transparent rest state.
 *
 * This list has to stay in step with the pages that render `<Hero>`. It exists
 * so the correct state ships in the HTML: without it the header would paint
 * white over the hero for one frame before the sentinels take over. Anything
 * not listed here — Contact, Careers, Procurement, the publication listings —
 * opens onto white and keeps the header solid from scroll 0.
 */
/**
 * Every page except the articles.
 *
 * This was a hand-kept list of six routes, then `true` for everything once
 * `PageHeader` started delegating to `Hero` and no page opened on anything
 * else. Both are now wrong: news items and stories open on white, with their
 * headline in blue type and their own photograph below it, because the hero
 * room was giving every article the same irrelevant banner and setting
 * hundred-character headlines at 88px.
 *
 * A shape rather than a list, so it cannot fall out of step the way the
 * original did: the two article routes are the exception, and the listings
 * above them are not — `/news-insights/news` still opens with the room, only
 * `/news-insights/news/<slug>` does not.
 *
 * Getting this wrong is not subtle. `false` on a hero page paints a solid bar
 * over the photograph for one frame; `true` on a white page is a white lockup
 * on white, invisible until the reader scrolls. `SiteHeader` also pins
 * defensively when it finds no sentinels, so the two have to agree twice
 * before anything is lost.
 */
const WHITE_GROUND = [
  /^\/news-insights\/(news|stories)\/[^/]+$/,
  // A vacancy page opens the same way an article does, and for the same
  // reason: a job description is a document somebody reads, not a place on
  // the site. The listing above it still opens with the room.
  /^\/get-involved\/careers\/[^/]+$/,
];

export function hasTransparentHeader(pathname?: string): boolean {
  const path = pathname ?? "";
  return !WHITE_GROUND.some((route) => route.test(path));
}
