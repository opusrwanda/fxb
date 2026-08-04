/**
 * ───────────────────────────────────────────────────────────────────────────
 *  SEED INPUT ONLY. THE SITE NO LONGER READS THIS.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * The newsroom is the News collection now.
 *
 * `scripts/seed-cms.ts` still reads it, because the migration has to be run
 * once more against the production database. Editing it changes nothing that
 * anybody can see — edit `/staff` instead.
 */
/**
 * Latest news.
 *
 * Headlines, dates and excerpts are transcribed from FXB Rwanda's live
 * newsroom — nothing here is written on the organisation's behalf. Slugs are
 * new, because the current URLs carry the old `media/news/...` shape that this
 * site replaces.
 *
 * As with `stories.ts`, this file exists only until the CMS is built; at that
 * point the same shape comes from the database and the News manager owns it.
 *
 * Photographs are drawn from the supplied library and chosen to match the
 * subject of each item. They are not the images that ran with the original
 * articles — those still need migrating with the full bodies. Each `alt`
 * describes what is actually in the frame, checked against the file, rather
 * than restating the headline.
 */
export type NewsItem = {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date, formatted at render so the output is stable server and client. */
  date: string;
  /**
   * BCP 47 tag, set only where the item is not in the site's language. FXB
   * Rwanda publishes in both English and French, and a French headline needs
   * marking so a screen reader switches voice rather than reading it as
   * mangled English.
   */
  language?: string;
  photo: string;
  alt: string;
  /**
   * The article itself, one string per paragraph.
   *
   * PENDING: the proposal commits to migrating the full bodies from the current
   * newsroom; only headlines, dates and excerpts came across so far. An item
   * without a body renders its excerpt and says the full piece is on its way,
   * rather than showing a blank article.
   */
  body?: string[];
};

export const news: NewsItem[] = [
  {
    slug: "open-days-2025-accompagner-les-familles-vers-la-resilience",
    title:
      "FXB Rwanda met en valeur son engagement lors des Journées Portes Ouvertes : accompagner les familles vers la résilience",
    excerpt:
      "Le mois de juin 2025 a été marqué par la participation active de FXB Rwanda aux Journées Portes Ouvertes (Open Days) dans les districts d'intervention.",
    date: "2025-07-09",
    language: "fr",
    photo: "fostering-03",
    alt: "Women and children seated on the grass at a community gathering, in front of FXB Rwanda banners",
  },
  {
    slug: "nutritional-campaign-gakenke-nyabihu",
    title:
      "Nutritional campaign to boost healthy living in Gakenke and Nyabihu districts",
    excerpt:
      "In a powerful move to combat malnutrition and promote healthy eating, FXB Rwanda, in collaboration with E4IMPACT and local partners, ran a nutrition campaign across both districts.",
    date: "2025-04-08",
    photo: "fostering-02",
    alt: "A community health worker leading a session with young children seated in a classroom",
  },
  {
    slug: "kungahara-fostering-farming-practices",
    title:
      "Farmers in Gakenke and Nyabihu districts enhance farming practices through the Kungahara-FOSTERING project",
    excerpt:
      "Over a period of three days, 30 cooperative representatives, 20 district and sector agriculture officers and 16 sector staff were trained in improved practice.",
    date: "2024-10-15",
    photo: "fostering-05",
    alt: "A farmer in protective overalls spraying a staked hillside crop",
  },
  {
    slug: "community-mobilisation-health-insurance-enrolment",
    title:
      "Community mobilisation boosted health insurance enrolment and disease prevention",
    excerpt:
      "Community mobilisation for health promotion, and supporting vulnerable families to access health services, are key interventions in Nyarugenge.",
    date: "2024-07-11",
    photo: "fxbvillage-musambira-05",
    alt: "A woman setting cups out on a wooden dish-drying rack beside her home",
  },
];

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatNewsDate(iso: string): string {
  return dateFormatter.format(new Date(`${iso}T00:00:00Z`));
}
