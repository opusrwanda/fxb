import type { Programme as ProgrammeDoc } from "../payload-types";
import { image, type Img } from "./image";
import type { RichText } from "./news";
import { cached, cms } from "./payload";

/**
 * A programme, as the site renders it.
 *
 * The collection the rest of the site leans on hardest: the Where We Work map,
 * the district counts, the programme pages and the "6 programmes across 13
 * districts" lines in two heroes are all derived from these. Phasing one out is
 * a single field in `/staff` and every one of those follows.
 */
export type Programme = {
  slug: string;
  name: string;
  /** District names, matching `src/lib/districts.ts` exactly — the map matches on them. */
  districts: string[];
  /** False once a programme has phased out; it then stops colouring the map. */
  current: boolean;
  summary?: string;
  body: RichText | null;
  /** Implementation period as written, e.g. "August 2022 – August 2025". */
  runs?: string;
  funder?: string;
  /** What the programme delivers, in its own words. */
  components: string[];
  /** A system of the programme's own — a dashboard, a portal. Most have none. */
  href?: string;
  /**
   * The description has not been confirmed by FXB.
   *
   * The programme names and districts come from the brief; the descriptions
   * were written to show the template carrying copy. The page renders a notice
   * while this is set, so nobody mistakes illustrative wording for FXB's own.
   */
  unconfirmed: boolean;
  image: Img | null;
};

function toProgramme(doc: ProgrammeDoc): Programme {
  return {
    slug: doc.slug,
    name: doc.name,
    districts: doc.districts ?? [],
    current: doc.stage !== "phased-out",
    summary: doc.summary ?? undefined,
    body: doc.body ?? null,
    runs: doc.runs ?? undefined,
    funder: doc.funder ?? undefined,
    components: (doc.components ?? []).map((row) => row.item),
    href: doc.externalUrl ?? undefined,
    unconfirmed: doc.unconfirmed === true,
    image: image(doc.photo),
  };
}

/**
 * Every published programme, in the order the team set.
 *
 * `order` first and name second, so a programme left without a number falls in
 * alphabetically rather than disappearing off the end of the list.
 */
export const getProgrammes = cached("programmes:all", "programmes", async () => {
  const payload = await cms();
  const { docs } = await payload.find({
    collection: "programmes",
    where: { _status: { equals: "published" } },
    sort: ["order", "name"],
    depth: 1,
    limit: 0,
    pagination: false,
  });
  return docs.map(toProgramme);
});

export const getProgramme = cached(
  "programmes:one",
  "programmes",
  async (slug: string): Promise<Programme | null> => {
    const payload = await cms();
    const { docs } = await payload.find({
      collection: "programmes",
      where: { slug: { equals: slug }, _status: { equals: "published" } },
      limit: 1,
      depth: 1,
      pagination: false,
    });
    return docs[0] ? toProgramme(docs[0]) : null;
  },
);

export async function getCurrentProgrammes(): Promise<Programme[]> {
  return (await getProgrammes()).filter((programme) => programme.current);
}

export async function getPhasedOutProgrammes(): Promise<Programme[]> {
  return (await getProgrammes()).filter((programme) => !programme.current);
}
