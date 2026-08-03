/**
 * Publications, annual reports and newsletters.
 *
 * The brief lists the categories and what each entry should show — cover image,
 * title, category, publication date, file size, download button — but ships no
 * files and no metadata. So the categories are real and the shelves are empty:
 * `publications` is typed and waiting, and the listing renders each category
 * with whatever it holds.
 *
 * Nothing is invented. A 2024 Annual Report the site claims to have and cannot
 * produce is worse than a page that says it is coming.
 */
export type PublicationCategory =
  | "annual-report"
  | "project-report"
  | "policy"
  | "brochure"
  | "newsletter";

export type Publication = {
  slug: string;
  title: string;
  category: PublicationCategory;
  /** ISO date, formatted at render so server and client agree. */
  date: string;
  /** Path or URL to the PDF. */
  file: string;
  /** Bytes. Rendered human-readable; the brief asks for file size. */
  bytes?: number;
  /** Photo id for the cover thumbnail, where one has been generated. */
  cover?: string;
  /** DRAFT entry, not a real document. Renders an unconfirmed notice. */
  draft?: boolean;
};

export const categories: {
  id: PublicationCategory;
  label: string;
  /** Anchor the header menu links to, where it has one. */
  anchor: string;
  description: string;
  /** What the brief says belongs here, shown while the shelf is empty. */
  examples: string[];
}[] = [
  {
    id: "annual-report",
    label: "Annual Reports",
    anchor: "annual-reports",
    description:
      "A full account of each year's programmes, reach and finances.",
    examples: ["2025 Annual Report", "2024 Annual Report", "2023 Annual Report"],
  },
  {
    id: "project-report",
    label: "Project Reports & Surveys",
    anchor: "project-reports",
    description:
      "Evidence from the field: what we set out to do, what happened, and what we learned.",
    examples: [
      "Final reports",
      "Baseline studies",
      "Mid-term evaluations",
      "Endline evaluations",
      "Lessons learned",
    ],
  },
  {
    id: "policy",
    label: "Policy Documents",
    anchor: "policy-documents",
    description:
      "How we work, and the commitments we hold ourselves to — particularly around children.",
    examples: [
      "Safeguarding Policy",
      "Child Protection Policy",
      "Code of Conduct",
      "Strategic Plan",
    ],
  },
  {
    id: "brochure",
    label: "Brochures & Factsheets",
    anchor: "brochures",
    description: "Short introductions to the organisation and its programmes.",
    examples: [
      "Organisation profile",
      "Programme brochures",
      "Project factsheets",
      "Infographics",
    ],
  },
];

/**
 * ───────────────────────────────────────────────────────────────────────────
 *  EVERY ENTRY BELOW IS DRAFT. THESE DOCUMENTS DO NOT EXIST. DO NOT PUBLISH.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * The brief names the categories and what each entry should carry — cover,
 * title, date, file size, download — but ships no files and no metadata. These
 * are placeholder entries written to show what the shelves look like carrying
 * documents, because four empty shelves tell you nothing about a layout.
 *
 * Titles, dates and sizes are invented. `file` points at paths that 404 by
 * design: a plausible-looking download that silently produces nothing would be
 * worse than one that visibly fails, and the page carries a notice saying so.
 *
 * Covers are real FXB Rwanda photographs used as stand-in cover art.
 *
 * Deleting this array restores the "coming to this page" panels exactly as they
 * were — the shelves already handle empty, and that is still the correct state
 * until FXB supplies the files.
 */
export const publications: Publication[] = [
  {
    slug: "annual-report-2025",
    title: "2025 Annual Report",
    category: "annual-report",
    date: "2025-06-30",
    file: "/publications/fxb-rwanda-annual-report-2025.pdf",
    bytes: 4_410_000,
    cover: "fxbvillage-tlf-14",
    draft: true,
  },
  {
    slug: "annual-report-2024",
    title: "2024 Annual Report",
    category: "annual-report",
    date: "2024-06-28",
    file: "/publications/fxb-rwanda-annual-report-2024.pdf",
    bytes: 3_820_000,
    cover: "fxbvillage-musambira-02",
    draft: true,
  },
  {
    slug: "annual-report-2023",
    title: "2023 Annual Report",
    category: "annual-report",
    date: "2023-06-30",
    file: "/publications/fxb-rwanda-annual-report-2023.pdf",
    bytes: 3_140_000,
    cover: "fxbvillage-mageragere-04",
    draft: true,
  },
  {
    slug: "fxbvillage-kamonyi-endline",
    title: "FXBVillage Kamonyi — Endline Evaluation",
    category: "project-report",
    date: "2025-03-14",
    file: "/publications/fxbvillage-kamonyi-endline-evaluation.pdf",
    bytes: 2_610_000,
    cover: "fxbvillage-tlf-03",
    draft: true,
  },
  {
    slug: "sugira-muryango-baseline",
    title: "Sugira Muryango — Baseline Study",
    category: "project-report",
    date: "2024-09-05",
    file: "/publications/sugira-muryango-baseline-study.pdf",
    bytes: 1_930_000,
    cover: "sugira-muryango-02",
    draft: true,
  },
  {
    slug: "kungahara-fostering-lessons",
    title: "Kungahara-FOSTERING — Lessons Learned",
    category: "project-report",
    date: "2024-02-20",
    file: "/publications/kungahara-fostering-lessons-learned.pdf",
    bytes: 1_240_000,
    cover: "fostering-03",
    draft: true,
  },
  {
    slug: "child-protection-policy",
    title: "Child Protection Policy",
    category: "policy",
    date: "2025-01-15",
    file: "/publications/child-protection-policy.pdf",
    bytes: 642_000,
    draft: true,
  },
  {
    slug: "safeguarding-policy",
    title: "Safeguarding Policy",
    category: "policy",
    date: "2025-01-15",
    file: "/publications/safeguarding-policy.pdf",
    bytes: 718_000,
    draft: true,
  },
  {
    slug: "code-of-conduct",
    title: "Code of Conduct",
    category: "policy",
    date: "2024-11-03",
    file: "/publications/code-of-conduct.pdf",
    bytes: 410_000,
    draft: true,
  },
  {
    slug: "strategic-plan-2024-2028",
    title: "Strategic Plan 2024 – 2028",
    category: "policy",
    date: "2024-01-10",
    file: "/publications/strategic-plan-2024-2028.pdf",
    bytes: 1_520_000,
    draft: true,
  },
  {
    slug: "organisation-profile",
    title: "FXB Rwanda — Organisation Profile",
    category: "brochure",
    date: "2025-04-02",
    file: "/publications/fxb-rwanda-organisation-profile.pdf",
    bytes: 905_000,
    draft: true,
  },
  {
    slug: "fxbvillage-model-factsheet",
    title: "The FXBVillage Model — Factsheet",
    category: "brochure",
    date: "2024-10-18",
    file: "/publications/fxbvillage-model-factsheet.pdf",
    bytes: 548_000,
    draft: true,
  },
  {
    slug: "newsletter-q3-2025",
    title: "Q3 2025",
    category: "newsletter",
    date: "2025-09-30",
    file: "/publications/fxb-rwanda-newsletter-q3-2025.pdf",
    bytes: 2180000,
    cover: "fxbvillage-tlf-12",
    draft: true,
  },
  {
    slug: "newsletter-q2-2025",
    title: "Q2 2025",
    category: "newsletter",
    date: "2025-06-30",
    file: "/publications/fxb-rwanda-newsletter-q2-2025.pdf",
    bytes: 1960000,
    cover: "sugira-muryango-05",
    draft: true,
  },
  {
    slug: "newsletter-q1-2025",
    title: "Q1 2025",
    category: "newsletter",
    date: "2025-03-31",
    file: "/publications/fxb-rwanda-newsletter-q1-2025.pdf",
    bytes: 2040000,
    cover: "fxbvillage-musambira-04",
    draft: true,
  },
  {
    slug: "newsletter-q4-2024",
    title: "Q4 2024",
    category: "newsletter",
    date: "2024-12-31",
    file: "/publications/fxb-rwanda-newsletter-q4-2024.pdf",
    bytes: 1870000,
    cover: "fostering-05",
    draft: true,
  },
  {
    slug: "newsletter-q3-2024",
    title: "Q3 2024",
    category: "newsletter",
    date: "2024-09-30",
    file: "/publications/fxb-rwanda-newsletter-q3-2024.pdf",
    bytes: 1740000,
    cover: "fxbvillage-mageragere-05",
    draft: true,
  },
  {
    slug: "newsletter-q2-2024",
    title: "Q2 2024",
    category: "newsletter",
    date: "2024-06-30",
    file: "/publications/fxb-rwanda-newsletter-q2-2024.pdf",
    bytes: 1610000,
    cover: "fxbvillage-tlf-09",
    draft: true,
  },
];

export const publicationsIn = (category: PublicationCategory) =>
  publications.filter((item) => item.category === category);

/**
 * Quarterly newsletters.
 *
 * The brief notes "the previous ones need to be migrated" — none have been
 * supplied yet, so this is deliberately empty rather than seeded with guesses.
 */
export const newsletters = publicationsIn("newsletter");

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatPublicationDate(iso: string): string {
  return dateFormatter.format(new Date(`${iso}T00:00:00Z`));
}

/** 4_194_304 -> "4.2 MB". Decimal units, as every download UI reports them. */
export function formatBytes(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1000;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}
