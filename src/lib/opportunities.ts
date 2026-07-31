/**
 * Vacancies and tenders.
 *
 * Both pages in the brief are written twice over — once for "when there are
 * vacancies" / "when available", and once for when there are none. That is the
 * whole specification: two states, driven by whether the list is empty. Both
 * lists are empty today, so both pages render the second state, in FXB's own
 * words.
 *
 * Adding an entry to either array switches its page over. Nothing else needs
 * touching.
 */
export type Vacancy = {
  slug: string;
  title: string;
  department: string;
  location: string;
  /** e.g. "Full-time", "Consultancy". */
  employmentType: string;
  /** ISO date. */
  deadline: string;
  /** How to apply, one string per paragraph. */
  howToApply: string[];
  /** Optional link to a full pack or an application portal. */
  file?: string;
};

export const vacancies: Vacancy[] = [];

export type Tender = {
  slug: string;
  title: string;
  /** Reference number as published, e.g. "FXB/RW/2026/004". */
  reference: string;
  category: string;
  /** ISO dates. */
  published: string;
  deadline: string;
  /** Tender documents to download. */
  documents: { label: string; file: string; bytes?: number }[];
};

export const tenders: Tender[] = [];

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDeadline(iso: string): string {
  return dateFormatter.format(new Date(`${iso}T00:00:00Z`));
}
