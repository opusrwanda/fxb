/**
 * ───────────────────────────────────────────────────────────────────────────
 *  SEED INPUT ONLY. THE SITE NO LONGER READS THIS.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * The stories are the Stories collection now.
 *
 * `scripts/seed-cms.ts` still reads it, because the migration has to be run
 * once more against the production database. Editing it changes nothing that
 * anybody can see — edit `/staff` instead.
 */
/**
 * Impact stories.
 *
 * Seeded from FXB Rwanda's live site — these are real published stories, and
 * the proposal already commits to migrating the most recent twelve months of
 * them. They live here only until the CMS is built; at that point this file is
 * replaced by the Impact Stories manager and the same shape comes from the
 * database.
 *
 * Excerpts are truncated as they appear on the current site. Full bodies still
 * need migrating.
 */
export type Story = {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date, formatted at render so the output is stable server and client. */
  date: string;
  photo: string;
  alt: string;
  /**
   * The story itself, one string per paragraph.
   *
   * PENDING: excerpts are truncated exactly as they appear on the current site
   * and the full bodies still need migrating. A story without a body renders
   * its excerpt and says so, rather than showing a blank article.
   */
  body?: string[];
};

export const stories: Story[] = [
  {
    slug: "chantal-gisagara-model-vegetable-garden",
    title:
      "Chantal from Gisagara turned her house backyard into a model vegetable garden",
    excerpt:
      "Chantal M. resides in Nyamugali Cell, located in Nyanza Sector of Gisagara District, along with her 3 children. Struggling with poverty, the family…",
    date: "2025-05-28",
    photo: "fxbvillage-musambira-01",
    alt: "A kitchen garden of cabbages and greens beside a family home",
  },
  {
    slug: "from-farm-to-table-fostering-nutrition",
    title:
      "From Farm to Table: FXB Rwanda's FOSTERING project reshapes nutritional routine in Gakenke and Nyabihu districts",
    excerpt:
      "Community members in Gakenke and Nyabihu districts are embracing new dietary practices following an enlightening campaign led by FXB Rwanda and…",
    date: "2024-06-27",
    photo: "fostering-01",
    alt: "A community nutrition session, with prepared food being served to children",
  },
  {
    slug: "from-sex-worker-to-private-sector",
    title: "From Sex Worker to private sector",
    excerpt:
      "Aline is a young mother of two children. Aline's family used to live in endless conflict. At 16 years old, she experienced asexual violence when…",
    date: "2024-01-28",
    photo: "fxbvillage-tlf-09",
    alt: "A tailor at his sewing machine in his own workshop",
  },
];

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatStoryDate(iso: string): string {
  return dateFormatter.format(new Date(`${iso}T00:00:00Z`));
}
