/**
 * The four areas of intervention.
 *
 * Shared by the home page's visual pillars and the Areas of Intervention
 * section on What We Do, so the two can never name or illustrate them
 * differently.
 *
 * `focus` is transcribed from the "Impact areas" the brief lists under each
 * heading in the Our Impact section — FXB's own words for the same four areas,
 * not a summary written here.
 *
 * CONTENT PENDING: the brief specifies these should eventually read as
 * "Context, Goal, Activities, Impact" and marks the copy "to be provided
 * later". Until it arrives each card shows the title, the focus areas and a
 * photograph — real content rather than a placeholder. Add a `context`, `goal`,
 * `activities` and `impact` field here when FXB supplies them.
 *
 * Herbal Medicine has no written content anywhere in the brief — not a
 * paragraph, not a focus list. It carries an empty `focus` and renders shorter
 * rather than with invented interventions.
 */
export type Area = {
  id: string;
  label: string;
  /** One line, shown on the home card hover and under the heading here. */
  blurb: string;
  href: string;
  focus: string[];
  photo: string;
  /** Describes what is in the frame, checked against the file. */
  alt: string;
};

export const areas: Area[] = [
  {
    id: "socio-economic-strengthening",
    label: "Socio-Economic Strengthening",
    blurb: "Savings groups, startup capital and enterprise",
    href: "/what-we-do#socio-economic-strengthening",
    focus: [
      "Entrepreneurship, VSLA savings groups & startup capital",
      "Family resilience & violence prevention",
      "Climate adaptation & environmental conservation",
    ],
    photo: "fxbvillage-tlf-10",
    alt: "A woman standing in the shop she runs, stocked floor to ceiling",
  },
  {
    id: "ecd-education",
    label: "ECD & Education",
    blurb: "Early childhood, school support and vocational training",
    href: "/what-we-do#ecd-education",
    focus: [
      "School support & scholastic materials",
      "Vocational & youth training",
      "Positive parenting & early stimulation",
    ],
    photo: "fxbvillage-mageragere-01",
    alt: "Two children in school uniform carrying their bags",
  },
  {
    id: "health",
    label: "Health",
    blurb: "HIV care, nutrition, maternal health and WASH",
    href: "/what-we-do#health",
    focus: [
      "HIV testing, counselling & prevention (incl. DREAMS)",
      "Health insurance enrolment & referrals",
      "Nutrition, maternal & child health, WASH infrastructure",
    ],
    photo: "fxbvillage-musambira-03",
    alt: "A child drinking clean water beside an FXB Rwanda household filter",
  },
  {
    id: "herbal-medicine",
    label: "Herbal Medicine",
    blurb: "Traditional practice, cultivated and applied",
    href: "/what-we-do#herbal-medicine",
    focus: [],
    photo: "fostering-06",
    alt: "Growers tending seedlings under a shade structure",
  },
];
