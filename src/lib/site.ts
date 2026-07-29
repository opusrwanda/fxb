/**
 * Site-wide constants drawn from the content structure document
 * (OK_FXB_Rwanda_Revamped_Website_Content_Structure.docx, 23 July 2026) and
 * the Brand Guiding Tool (24 July 2026).
 */

export const org = {
  name: "FXB Rwanda",
  legalName: "Francois Xavier Bagnoud",
  endorsement: "Member of FXB Global",
  vision: "Empowered and resilient communities shaping their own future.",
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
  linktree: "https://linktr.ee/fxbrwanda",
  officeHours: "Monday – Friday, 8:00 AM – 5:00 PM",
} as const;

export type NavChild = { label: string; href: string };
export type NavItem = { label: string; href: string; children?: NavChild[] };

export const primaryNav: NavItem[] = [
  {
    label: "Who We Are",
    href: "/who-we-are",
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
    children: [
      { label: "Results at a Glance", href: "/our-impact#results" },
      { label: "Success Stories", href: "/our-impact/success-stories" },
      { label: "Publications", href: "/news-insights/publications" },
      { label: "Annual Reports", href: "/news-insights/publications#annual-reports" },
      { label: "Media Gallery", href: "/our-impact/media-gallery" },
    ],
  },
  {
    label: "News & Insights",
    href: "/news-insights",
    children: [
      { label: "Latest News", href: "/news-insights/news" },
      { label: "Stories", href: "/news-insights/stories" },
      { label: "Publications", href: "/news-insights/publications" },
      { label: "Newsletters", href: "/news-insights/newsletters" },
    ],
  },
  {
    label: "Get Involved",
    href: "/get-involved",
    children: [
      { label: "Partner With Us", href: "/get-involved/partners" },
      { label: "Careers", href: "/get-involved/careers" },
      { label: "Procurement", href: "/get-involved/procurement" },
      { label: "Donate", href: "/get-involved/donate" },
    ],
  },
  { label: "Contact", href: "/contact" },
];

/** External systems referenced in the footer quick links and header utility strip. */
export const externalSystems: NavChild[] = [
  { label: "Sugira Muryango Dashboard", href: "https://sugiramuryango.fxbrwanda.org" },
  { label: "POMC", href: "http://185.194.218.11" },
];

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
const TRANSPARENT_HEADER_ROUTES = [
  "/",
  "/who-we-are",
  "/what-we-do",
  "/our-impact",
  "/news-insights",
  "/get-involved",
];

export function hasTransparentHeader(pathname: string): boolean {
  return TRANSPARENT_HEADER_ROUTES.includes(pathname);
}
