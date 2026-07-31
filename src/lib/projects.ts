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
  /** Set only where the project has a system of its own to link to. */
  href?: string;
  /**
   * Implementation period, e.g. "2019 – 2023".
   *
   * PENDING: the brief asks the Phased-out Projects page to show "photo with
   * title of the project and the period of implementation", but supplies
   * neither periods nor phased-out projects. Nothing is guessed — a project
   * without a period renders without one.
   */
  period?: string;
  /** Photo id from `photos.ts`. Pending for the same reason as `period`. */
  photo?: string;
};

export const projects: Project[] = [
  {
    id: "fxbvillage",
    name: "FXBVillage",
    districts: ["Kamonyi", "Nyarugenge", "Gisagara", "Nyaruguru"],
    active: true,
    href: "/what-we-do#fxbvillage-model",
  },
  {
    id: "kungahara-fostering",
    name: "Kungahara-FOSTERING",
    districts: ["Gakenke", "Nyabihu"],
    active: true,
  },
  {
    id: "sugira-muryango",
    name: "Sugira Muryango",
    districts: ["Musanze", "Kirehe", "Rubavu", "Nyanza", "Ngoma"],
    active: true,
    href: "https://sugiramuryango.fxbrwanda.org",
  },
  {
    id: "nsp-hiv",
    name: "National Strategic Plan on HIV",
    districts: ["Musanze", "Gakenke", "Nyabihu"],
    active: true,
  },
  {
    id: "pose",
    name: "POSE",
    districts: ["Huye"],
    active: true,
  },
  {
    id: "igire-turengere-abana",
    name: "IGIRE Turengere Abana",
    districts: ["Huye", "Rwamagana", "Nyanza"],
    active: true,
  },
];

/**
 * District name -> the projects running there.
 *
 * Built from `projects` rather than maintained alongside it, so the two can
 * never disagree. Districts with no project simply have no entry.
 */
export function projectsByDistrict(
  only: readonly Project[] = projects
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

/**
 * Projects that have ended.
 *
 * Empty today: the brief names 54 delivered FXBVillage projects but lists none
 * of them, and the Phased-out Projects heading in the document has no content
 * under it at all. Flipping `active` to false on a project above moves it here,
 * off the map, and onto that page.
 */
export const phasedOutProjects = projects.filter((project) => !project.active);
