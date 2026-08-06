/**
 * ───────────────────────────────────────────────────────────────────────────
 *  SEED INPUT ONLY. THE SITE NO LONGER READS THIS.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * The programmes are the Programmes collection now.
 *
 * Nothing reads it. The seed script that did was retired when the content moved
 * to Payload, and production is now reached by `scripts/migrate-from-payload.ts`,
 * which reads Payload's database and not this file. Editing it changes nothing
 * that anybody can see — edit `/staff` instead. It is kept only as the record
 * of what the site shipped with, and can go once production has been migrated.
 */
/**
 * Where we work: projects and the districts they run in.
 *
 * Transcribed exactly from the Where We Work table in the content brief
 * (OK_FXB_Rwanda_Revamped_Website_Content_Structure.docx). Nothing is added:
 * the brief gives project names and districts and no more, so there are no
 * invented descriptions, budgets or dates here.
 *
 * `active` exists because of the client's note on this section — "in case there
 * is no longer a project in a district, there should be an option to untick
 * that district from the list". Ending a project is a one-line edit here, and
 * the map, the counts and the district list all follow from it. Setting it to
 * false keeps the record rather than deleting the history, which is what the
 * Phased-out Projects page will want.
 *
 * Until the CMS is built this file is the source of truth; afterwards the same
 * shape comes from the database.
 */
export type Project = {
  id: string;
  /** As written in the brief, including its own capitalisation. */
  name: string;
  /** District names, matching `districts.ts` exactly. */
  districts: string[];
  /** False once a project has phased out; it then stops colouring the map. */
  active: boolean;
  /**
   * An external system belonging to this programme — a dashboard, a portal.
   *
   * It used to double as "somewhere related to link to", which is why
   * FXBVillage pointed at an anchor on the What We Do page: there was no
   * programme page to point at, so the field was carrying two different jobs
   * and only two of the six had anything in it. Every programme now has a page
   * of its own at `/what-we-do/programmes/<id>`, so this is back to meaning one
   * thing, and stays empty for the five that have no system.
   */
  href?: string;

  /**
   * ─────────────────────────────────────────────────────────────────────────
   *  EVERYTHING BELOW IS DRAFT. IT IS NOT FXB RWANDA'S COPY. DO NOT PUBLISH.
   * ─────────────────────────────────────────────────────────────────────────
   *
   * The brief's Where We Work table gives project names and districts and
   * nothing else — no descriptions, no funders, no periods. This copy was
   * written to show what the programme template looks like carrying real
   * content, because an empty state tells you nothing about a layout.
   *
   * It is plausible rather than true. Some of it is grounded — the ITAP banner
   * visible in `itap-closing-rwamagana-01` names the components, the districts
   * and the programme period, and Sugira Muryango is a documented national
   * early childhood programme — but none of it has been confirmed by FXB, and
   * the figures in particular are illustrative.
   *
   * `draft: true` is what keeps it honest: the page renders the full design and
   * a notice saying the description is unconfirmed. Clearing the flag is a
   * deliberate act, so nobody publishes this by forgetting about it.
   */
  summary?: string;
  /** Body copy, one string per paragraph. */
  body?: string[];
  /** Implementation period as written, e.g. "August 2022 – August 2025". */
  runs?: string;
  /** Who funds it. */
  funder?: string;
  /** The programme's own components, as it names them. */
  components?: string[];
  /** DRAFT copy, not FXB's. Renders an unconfirmed notice. See above. */
  draft?: boolean;
  /**
   * Implementation period, e.g. "2019 – 2023".
   *
   * PENDING: the brief asks the Phased-out Projects page to show "photo with
   * title of the project and the period of implementation", but supplies
   * neither periods nor phased-out projects. Nothing is guessed — a project
   * without a period renders without one.
   */
  period?: string;
  /**
   * Photo id from `photos.ts`, and what is actually in the frame.
   *
   * Three of the six are the programme's own photography — the supplied library
   * is grouped by project, so `fostering-*` really is Kungahara-FOSTERING and
   * `sugira-muryango-*` really is Sugira Muryango. The other three are marked
   * STAND-IN below: FXB has supplied no photography for the National Strategic
   * Plan on HIV or POSE at all, and the single ITAP frame is already carrying
   * the projects band further up the page.
   *
   * The stand-ins are real FXB Rwanda photographs from Rwanda, and the alt text
   * describes what is in the picture rather than claiming it shows that
   * programme — a caption is a factual claim in the same way the district map
   * is. Replacing them is a two-line edit here once FXB sends their own.
   */
  photo?: string;
  /** Describes the frame, not the programme. See the note on `photo`. */
  photoAlt?: string;
};

export const projects: Project[] = [
  {
    id: "fxbvillage",
    name: "FXBVillage",
    districts: ["Kamonyi", "Nyarugenge", "Gisagara", "Nyaruguru"],
    active: true,
    photo: "fxbvillage-tlf-07",
    photoAlt: "A man tending livestock and seedlings at his homestead",
    draft: true,
    summary:
      "A three-year route out of extreme poverty, built around the household rather than around a sector.",
    body: [
      "FXBVillage takes a cohort of the most vulnerable households in a sector and works with them for 36 months. Families are selected with local government from Ubudehe category 1, and each one is assessed across income, nutrition, health, education, housing and child protection before anything is delivered.",
      "The first months are spent on trust and on emergency needs — nutrition support, health insurance enrolment, getting children who have dropped out back into school. From month seven the emphasis shifts to income: technical and business training, VSLA membership, and startup capital for an income-generating activity the household chooses.",
      "By the third year the household is consolidating. Savings and assets grow, food security stabilises, and support tapers deliberately so that exit is a planned event rather than an interruption. Families graduate when they no longer need us.",
    ],
    runs: "36 months per cohort",
    funder: "FXB International and institutional donors",
    components: [
      "Household coaching",
      "Economic empowerment",
      "Nutrition & food security",
      "Education",
      "Health & WASH",
    ],
  },
  {
    id: "kungahara-fostering",
    name: "Kungahara-FOSTERING",
    districts: ["Gakenke", "Nyabihu"],
    active: true,
    photo: "fostering-02",
    photoAlt: "A facilitator working with a room full of young children",
    draft: true,
    summary:
      "Climate-resilient farming and nutrition support for households in Gakenke and Nyabihu.",
    body: [
      "Kungahara-FOSTERING works with smallholder families on the productivity and the resilience of what they grow. Households are supported to establish kitchen gardens and orchards using climate-adapted practices, and to add small livestock so that protein is available year-round rather than seasonally.",
      "Training covers nutrition as well as agriculture — meal diversification, child feeding, and preparing balanced diets from what the household actually produces. The two run together deliberately: a better harvest does not become better nutrition on its own.",
    ],
    runs: "Ongoing",
    funder: "Institutional donors",
    components: [
      "Kitchen gardens & orchards",
      "Small livestock",
      "Nutrition training",
      "Climate-resilient practice",
    ],
  },
  {
    id: "sugira-muryango",
    name: "Sugira Muryango",
    districts: ["Musanze", "Kirehe", "Rubavu", "Nyanza", "Ngoma"],
    active: true,
    photo: "sugira-muryango-04",
    photoAlt:
      "Participants and staff in Sugira Muryango shirts at a community gathering",
    href: "https://sugiramuryango.fxbrwanda.org",
    draft: true,
    summary:
      "Home visiting for families with young children, delivered by trained community coaches.",
    body: [
      "Sugira Muryango — \u201cstrengthen the family\u201d — is an early childhood development programme for households with children under three. Trained community-based coaches visit families at home over several months, working with both parents on responsive caregiving, play, hygiene and nutrition.",
      "The model is deliberately father-inclusive. Sessions are designed for both caregivers, and reducing family conflict and harsh discipline is treated as part of the child's development rather than as a separate welfare concern.",
      "Delivery is embedded in the government system, with coaches supervised locally and families referred on to health and social protection services where the visits surface a need.",
    ],
    runs: "Ongoing",
    funder: "Government of Rwanda and development partners",
    components: [
      "Home visiting",
      "Responsive caregiving & play",
      "Father engagement",
      "Violence prevention",
      "Referrals",
    ],
  },
  {
    id: "nsp-hiv",
    name: "National Strategic Plan on HIV",
    districts: ["Musanze", "Gakenke", "Nyabihu"],
    active: true,
    // STAND-IN — not this programme's own photography.
    photo: "fxbvillage-mageragere-02",
    photoAlt:
      "A boy in school uniform beside an FXB Rwanda household water filter",
    draft: true,
    summary:
      "Community delivery of Rwanda's national HIV response in Musanze, Gakenke and Nyabihu.",
    body: [
      "FXB Rwanda delivers community components of the National Strategic Plan on HIV in three districts: voluntary counselling and testing, follow-up and psychosocial support for people living with HIV, and repeated prevention and awareness sessions.",
      "The work sits alongside maternal and child health activity and health insurance enrolment, so that a household reached for one reason is not left unsupported on the others.",
    ],
    runs: "Aligned to the national strategic plan period",
    funder: "Government of Rwanda and health partners",
    components: [
      "HIV testing & counselling",
      "Treatment follow-up",
      "Psychosocial support",
      "Prevention & awareness",
    ],
  },
  {
    id: "pose",
    name: "POSE",
    districts: ["Huye"],
    active: true,
    // STAND-IN — not this programme's own photography.
    photo: "fxbvillage-tlf-11",
    photoAlt: "A young man running his mobile money and airtime kiosk",
    draft: true,
    summary:
      "Household economic strengthening and social protection support in Huye.",
    body: [
      "POSE works with vulnerable households in Huye on the economic footing that makes every other outcome hold — savings group membership, business skills, and support into income-generating activity.",
      "Support is paired with access to social protection and basic services, so that households moving out of immediate crisis also get connected to the systems that keep them out of it.",
    ],
    runs: "Ongoing",
    funder: "Institutional donors",
    components: [
      "VSLA savings groups",
      "Business skills",
      "Income-generating activities",
      "Social protection linkage",
    ],
  },
  {
    id: "igire-turengere-abana",
    name: "IGIRE Turengere Abana",
    districts: ["Huye", "Rwamagana", "Nyanza"],
    active: true,
    // STAND-IN — not this programme's own photography.
    photo: "fxbvillage-musambira-01",
    photoAlt:
      "A woman tending a climate-resilient kitchen garden beside her home",
    draft: true,
    summary:
      "\u201cLet us protect children\u201d — orphans and vulnerable children, and adolescent girls and young women, across three districts.",
    body: [
      "IGIRE Turengere Abana (ITAP) works with vulnerable children and their families in Nyanza, Rwamagana and Huye. The programme supports households to adopt healthier practices, keeps children in school, and strengthens the family environment around them.",
      "Its DREAMS component focuses on adolescent girls and young women, combining HIV prevention with the economic and social support that makes prevention hold. Alongside it, the programme works with community and facility structures to improve the quality and reach of services for children.",
    ],
    runs: "August 2022 \u2013 August 2025",
    funder: "USAID",
    components: [
      "OVC support",
      "DREAMS",
      "Child protection",
      "Health service quality",
    ],
  },
];

/**
 * District name -> the projects running there.
 *
 * Built from `projects` rather than maintained alongside it, so the two can
 * never disagree. Districts with no project simply have no entry.
 */
export function projectsByDistrict(
  only: readonly Project[] = projects,
): Map<string, Project[]> {
  const index = new Map<string, Project[]>();

  for (const project of only) {
    for (const district of project.districts) {
      const existing = index.get(district);
      if (existing) existing.push(project);
      else index.set(district, [project]);
    }
  }

  return index;
}

export const activeProjects = projects.filter((project) => project.active);

/** Look up one programme by its id, which is also its URL slug. */
export function projectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.id === slug);
}

/**
 * Projects that have ended.
 *
 * Empty today: the brief names 54 delivered FXBVillage projects but lists none
 * of them, and the Phased-out Projects heading in the document has no content
 * under it at all. Flipping `active` to false on a project above moves it here,
 * off the map, and onto that page.
 */
export const phasedOutProjects = projects.filter((project) => !project.active);
