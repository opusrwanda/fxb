import { and, asc, eq, sql } from "drizzle-orm";

import { db, media, programmes } from "@/staff/db";
import type { RichText } from "@/staff/db/schema";
import { cached } from "./cache";
import { image, type Img } from "./image";

/**
 * A programme, as the site renders it.
 *
 * The table the rest of the site leans on hardest: the Where We Work map, the
 * district counts, the programme pages and the "6 programmes across 13
 * districts" lines in two heroes are all derived from these. Phasing one out is
 * a single field in the panel and every one of those follows.
 */
export type Programme = {
  /** Row id, so a parent can be matched to its children. */
  id: number;
  /** The programme this one sits under, or null. */
  parentId: number | null;
  slug: string;
  name: string;
  /** District names, matching `src/lib/districts.ts` — the map matches on them. */
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
  /** FXB has not confirmed the description; the page says so while this is set. */
  image: Img | null;
};

type Row = {
  programme: typeof programmes.$inferSelect;
  photo: typeof media.$inferSelect | null;
};

const toProgramme = ({ programme: p, photo }: Row): Programme => ({
  slug: p.slug,
  name: p.name,
  districts: p.districts ?? [],
  current: p.stage !== "phased-out",
  parentId: p.parentId,
  id: p.id,
  summary: p.summary ?? undefined,
  body: p.body,
  runs: p.runs ?? undefined,
  funder: p.funder ?? undefined,
  components: p.components ?? [],
  href: p.externalUrl ?? undefined,
  image: image(photo),
});

/**
 * Every published programme, in the order the team set.
 *
 * `nulls last` so a programme left without a number falls in at the end
 * alphabetically rather than jumping to the front — Postgres sorts nulls first
 * on an ascending order by default, which would put an unnumbered programme
 * above the Chairperson's, so to speak.
 */
export const getProgrammes = cached("programmes:all", "programmes", async () => {
  const rows = await db
    .select({ programme: programmes, photo: media })
    .from(programmes)
    .leftJoin(media, eq(programmes.photoId, media.id))
    .where(eq(programmes.status, "published"))
    .orderBy(sql`${programmes.order} asc nulls last`, asc(programmes.name));

  return rows.map(toProgramme);
});

export const getProgramme = cached(
  "programmes:one",
  "programmes",
  async (slug: string): Promise<Programme | null> => {
    const rows = await db
      .select({ programme: programmes, photo: media })
      .from(programmes)
      .leftJoin(media, eq(programmes.photoId, media.id))
      .where(and(eq(programmes.slug, slug), eq(programmes.status, "published")))
      .limit(1);

    return rows[0] ? toProgramme(rows[0]) : null;
  },
);

export async function getCurrentProgrammes(): Promise<Programme[]> {
  return (await getProgrammes()).filter((programme) => programme.current);
}

export async function getPhasedOutProgrammes(): Promise<Programme[]> {
  return (await getProgrammes()).filter((programme) => !programme.current);
}

/** A top-level programme with whatever sits under it. */
export type ProgrammeGroup = Programme & { children: Programme[] };

/**
 * The running programmes, with sub-programmes nested under their parent.
 *
 * FXBVillage is the case this exists for: the model is delivered as a series of
 * projects — Mageragere in Nyarugenge, the one run with The Light Foundation,
 * and whichever starts next — and they are programmes in their own right with
 * their own districts, funders and periods. Flat, the section could name the
 * model or the projects but not both.
 *
 * A child whose parent is not itself running is promoted to the top level
 * rather than disappearing. Phasing out a parent should not silently take four
 * live projects off the site with it.
 */
export async function getProgrammeGroups(): Promise<ProgrammeGroup[]> {
  const running = await getCurrentProgrammes();
  const byId = new Map(running.map((p) => [p.id, p]));

  const groups = running
    .filter((p) => p.parentId === null || !byId.has(p.parentId))
    .map((p) => ({ ...p, children: [] as Programme[] }));

  const groupById = new Map(groups.map((g) => [g.id, g]));
  for (const p of running) {
    if (p.parentId === null) continue;
    groupById.get(p.parentId)?.children.push(p);
  }

  return groups;
}
