/**
 * The FXBVillage model.
 *
 * Every string here is transcribed from the What We Do section of the content
 * brief. Nothing is written on FXB Rwanda's behalf and nothing is summarised —
 * where the brief gives a paragraph, the paragraph is here in full.
 *
 * Spelling is normalised to the site's British-English convention
 * (counselling, programme, behaviour), because the brief mixes both within a
 * single sentence. Wording is untouched.
 *
 * Known gap: the brief introduces the pillars as "six mutually reinforcing
 * pillars" and then lists five. The five below are all it supplies; the
 * heading copy in `model-pillars.tsx` therefore does not claim a number. See
 * the note there.
 */

export type Phase = {
  /** Step number as the brief numbers them. */
  step: number;
  period: string;
  body: string;
};

/** The 36-month transformation journey, as a progressive timeline. */
export const journey: Phase[] = [
  {
    step: 1,
    period: "0–6 months",
    body: "Building trust between participants and FXB teams, emergency nutrition support, reintegration into school for children who have interrupted their education, access to mutual health insurance and healthcare services, and a gradual shift toward practices that support well-being and learning.",
  },
  {
    step: 2,
    period: "7–12 months",
    body: "Strengthening technical, entrepreneurial, and business skills, forming VSLA groups, providing startup capital, and launching the first income-generating activities.",
  },
  {
    step: 3,
    period: "13–24 months",
    body: "Consolidating income, increasing savings and assets, improving access to fundamental rights (food security, education, health, and WASH), and the gradual empowerment of women.",
  },
  {
    step: 4,
    period: "25–36 months",
    body: "Strengthening sustainable livelihoods, significantly improving the well-being of children and adults, reducing dependence on external aid: achieving economic, social, and human autonomy and exiting the programme.",
  },
];

export type Principle = { id: string; title: string; body: string };

/** The three guiding principles. Titles only until opened — see the brief. */
export const principles: Principle[] = [
  {
    id: "integrated-development",
    title: "Integrated Development",
    body: "Families experience multiple challenges at the same time. Our interventions therefore address health, education, livelihoods, nutrition, child protection, environmental sustainability, and social inclusion simultaneously.",
  },
  {
    id: "community-ownership",
    title: "Community Ownership",
    body: "Communities are active partners — not passive beneficiaries. Families participate in identifying their needs, planning solutions, implementing activities, and sustaining achievements beyond the project lifecycle.",
  },
  {
    id: "sustainable-transformation",
    title: "Sustainable Transformation",
    body: "Our goal is not to create dependency but to strengthen resilience. By building local capacities and promoting self-reliance, communities are empowered to continue progressing independently.",
  },
];

export type Intervention = { name: string; body: string };

export type Pillar = {
  id: string;
  title: string;
  /** Only the first pillar carries a lead paragraph in the brief. */
  lead?: string;
  interventions: Intervention[];
};

export const pillars: Pillar[] = [
  {
    id: "home-visits-and-coaching",
    title: "Home visits and coaching",
    lead: "Home visits and individualised coaching are the foundation of the FXBVillage model. Each family benefits from regular follow-up by FXB teams and community facilitators trained as part of the project, fostering a relationship of trust.",
    interventions: [
      {
        name: "Multidimensional assessments",
        body: "Household assessments to identify economic, nutritional, health, educational, and psychosocial vulnerabilities.",
      },
      {
        name: "Personalised development plans",
        body: "Co-created with family heads for tailored support.",
      },
      {
        name: "Parenting coaching",
        body: "Including fathers' involvement, child protection, hygiene, nutrition, family planning, and positive behaviour change.",
      },
      {
        name: "Psychosocial support",
        body: "To address trauma, low self-esteem, and family conflict. Referral to appropriate services when necessary.",
      },
    ],
  },
  {
    id: "economic-empowerment",
    title: "Economic Empowerment",
    interventions: [
      {
        name: "VSLA associations",
        body: "Implementation of Village Savings and Loan Associations (VSLA) enabling families to save regularly, access small loans, and develop financial literacy. Beyond their financial function, VSLAs serve as platforms for training, learning, and peer solidarity, contributing to the sustainability of the project.",
      },
      {
        name: "Startup capital & income-generating activities",
        body: "Provision of startup capital intended to launch income-generating activities (IGAs) in areas such as agriculture, livestock, small trade, food services, or various workshops.",
      },
      {
        name: "Commercial and entrepreneurial training",
        body: "Training in business and entrepreneurial skills, including financial literacy, budgeting, basic accounting, project management, and market analysis.",
      },
      {
        name: "Collective social enterprises",
        body: "Creation of collective social enterprises (CSEs) developed to strengthen collective income and reduce individual risks, with ongoing coaching and mentoring.",
      },
    ],
  },
  {
    id: "nutrition-and-food-security",
    title: "Nutrition and Food Security",
    interventions: [
      {
        name: "Nutrition training",
        body: "Families received training on nutrition, child feeding, meal diversification, and preparing balanced diets.",
      },
      {
        name: "Kitchen gardens & orchards",
        body: "The cultivation of kitchen gardens and orchards using climate-resilient farming practices was encouraged in order to improve year-round access to nutrient-rich foods.",
      },
      {
        name: "Poultry & small livestock farming",
        body: "Developing household livestock production strengthened food security by supporting sustainable access to eggs and other sources of protein.",
      },
    ],
  },
  {
    id: "education-and-access-to-information",
    title: "Education and access to information",
    interventions: [
      {
        name: "Direct school support",
        body: "The project covered school fees and related contributions, distributed school supplies and uniforms (100% in the 1st year, 75% in the 2nd year, 50% in the 3rd year). School follow-up visits and close support for parents/guardians and teachers.",
      },
      {
        name: "Early childhood development",
        body: "Training for parents/guardians and community volunteers in positive parenting, child growth monitoring, and child stimulation.",
      },
      {
        name: "Youth vocational training",
        body: "Technical and vocational education and training, internships, and tool kits to support the transition to employment or self-employment.",
      },
      {
        name: "School canteens",
        body: "Support for school canteens plays an important role in improving attendance and school retention.",
      },
    ],
  },
  {
    id: "health-and-wash",
    title: "Health and Water, Sanitation and Hygiene (WASH)",
    interventions: [
      {
        name: "Health insurance",
        body: "Enrolment and renewal of health insurance and referrals to health facilities.",
      },
      {
        name: "HIV testing and counselling",
        body: "Voluntary counselling and testing, follow-up for people living with HIV, psychosocial support, as well as repeated awareness sessions on disease prevention, and maternal and child health.",
      },
      {
        name: "WASH infrastructure",
        body: "Hygiene kits, handwashing facilities, improved latrines, outdoor showers, ventilated kitchens, composts and, when necessary, rehabilitation or construction of housing.",
      },
    ],
  },
];

/*
 * `projectsDelivered` used to live here as 54, taken from the brief.
 *
 * It is a figure that changes, and it was in two places: this constant, which
 * What We Do read, and the Impact figures global, which Our Impact and the
 * phased-out projects page read. Updating it in /staff moved two of the three.
 * It now lives only in the CMS — see `getReach()`.
 */
