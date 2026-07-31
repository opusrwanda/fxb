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

export const publications: Publication[] = [];

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
