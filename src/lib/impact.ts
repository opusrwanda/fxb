/**
 * Impact figures.
 *
 * Two views of the same data, and the relationship between them matters:
 *
 * The **Our Impact page** reports four aggregates (content brief, "Our Reach
 * (Since 2012)"). The **Home page** breaks three of those aggregates back out
 * into the six programme areas a visitor sees in the Our Impact menu, which is
 * what the brief means by "rotating counter cards ... as they appear in the
 * Our Impact menu".
 *
 *   Socio-Economic Strengthening  1,090,288+  =  Economic Empowerment
 *                                              +  Child Protection
 *                                              +  Climate & Environment
 *   ECD & Education                 505,247+  =  Education
 *   Health                        1,389,426+  =  Health & Nutrition
 *   Children & Families Reached   2,984,961+  =  the total
 *
 * So three of the six home figures are components of the 1,090,288+ aggregate
 * and cannot be derived from it — MEL has to split them. Those carry
 * `value: null` and render without a number rather than with an invented one.
 * The brief marks every figure here "(Insert updated statistics from
 * MEL/database)", so all of them want confirming before launch.
 */

export type ImpactArea = {
  id: string;
  label: string;
  /** null until MEL supplies the figure. Never guess one. */
  value: number | null;
  caption: string;
  /** Revealed on hover, per the client's note on the Our Impact section. */
  areas: string[];
  photo: string;
  href: string;
};

/**
 * Our Reach (Since 2012) — the four aggregates reported on the Our Impact page.
 *
 * These are the figures exactly as the brief states them, with the "+" that
 * travels with each one. The three programme aggregates do not sum to the
 * total: they count reach per area and a household reached by two areas appears
 * in both, which is why the fourth figure is reported separately rather than
 * derived.
 *
 * The brief marks all of these "(Insert updated statistics from MEL/database)",
 * so every one wants confirming before launch.
 */
export type ReachFigure = {
  id: string;
  label: string;
  value: number;
  caption: string;
  /** Revealed on hover, per the client's note on this section. */
  areas: string[];
  photo: string;
};

export const reach: ReachFigure[] = [
  {
    id: "socio-economic-strengthening",
    label: "Socio-Economic Strengthening",
    value: 1090288,
    caption:
      "Individuals and households reached through economic empowerment, violence prevention & family strengthening, and climate & environment initiatives combined.",
    areas: [
      "Entrepreneurship, VSLA savings groups & startup capital",
      "Family resilience & violence prevention",
      "Climate adaptation & environmental conservation",
    ],
    photo: "fxbvillage-tlf-03",
  },
  {
    id: "ecd-education",
    label: "ECD & Education",
    value: 505247,
    caption:
      "Children and young families supported through early childhood development and education combined.",
    areas: [
      "School support & scholastic materials",
      "Vocational & youth training",
      "Positive parenting & early stimulation",
    ],
    photo: "fxbvillage-tlf-04",
  },
  {
    id: "health",
    label: "Health",
    value: 1389426,
    caption:
      "People reached through HIV/AIDS prevention and care, health, nutrition, and WASH interventions combined.",
    areas: [
      "HIV testing, counselling & prevention (incl. DREAMS)",
      "Health insurance enrolment & referrals",
      "Nutrition, maternal & child health, WASH infrastructure",
    ],
    photo: "fxbvillage-mageragere-02",
  },
  {
    id: "children-families",
    label: "Children & Families Reached",
    value: 2984961,
    caption:
      "Children and vulnerable individuals supported through our programmes.",
    areas: [
      "All four provinces and the City of Kigali",
      "54 FXBVillage projects delivered",
      "Reached since 2012",
    ],
    photo: "fxbvillage-tlf-14",
  },
];

export const impactAreas: ImpactArea[] = [
  {
    id: "children-families",
    label: "Children & Families Reached",
    value: 2984961,
    caption: "Children and vulnerable individuals supported through our programmes",
    areas: [
      "All four provinces and the City of Kigali",
      "54 FXBVillage projects delivered",
      "Reached since 2012",
    ],
    photo: "fxbvillage-tlf-14",
    href: "/our-impact#children-families",
  },
  {
    id: "education",
    label: "Education",
    value: 505247,
    caption:
      "Children and young families supported through early childhood development and education",
    areas: [
      "School support & scholastic materials",
      "Vocational & youth training",
      "Positive parenting & early stimulation",
    ],
    photo: "fxbvillage-tlf-04",
    href: "/our-impact#ecd-education",
  },
  {
    id: "health-nutrition",
    label: "Health & Nutrition",
    value: 1389426,
    caption:
      "People reached through HIV prevention and care, health, nutrition and WASH",
    areas: [
      "HIV testing, counselling & prevention",
      "Health insurance enrolment & referrals",
      "Nutrition, maternal and child health, WASH",
    ],
    photo: "fxbvillage-mageragere-02",
    href: "/our-impact#health",
  },
  {
    id: "economic-empowerment",
    label: "Economic Empowerment",
    value: null,
    caption: "Part of 1,090,288+ reached through socio-economic strengthening",
    areas: [
      "VSLA savings groups & startup capital",
      "Income-generating activities",
      "Collective social enterprises",
    ],
    photo: "fxbvillage-tlf-03",
    href: "/our-impact#socio-economic-strengthening",
  },
  {
    id: "child-protection",
    label: "Child Protection",
    value: null,
    caption: "Part of 1,090,288+ reached through socio-economic strengthening",
    areas: [
      "Family resilience & violence prevention",
      "Positive parenting and fathers' involvement",
      "Psychosocial support and referrals",
    ],
    photo: "sugira-muryango-01",
    href: "/our-impact#socio-economic-strengthening",
  },
  {
    id: "climate-environment",
    label: "Climate & Environment",
    value: null,
    caption: "Part of 1,090,288+ reached through socio-economic strengthening",
    areas: [
      "Climate adaptation & environmental conservation",
      "Climate-resilient kitchen gardens",
      "Clean cooking and household energy",
    ],
    photo: "fxbvillage-musambira-02",
    href: "/our-impact#climate-environment",
  },
];
