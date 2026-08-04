import { image, type Img } from "./image";
import { cached, cms } from "./payload";

/**
 * One of the reach figures.
 *
 * `value` is nullable because three of the six figures the home page shows are
 * components of an aggregate MEL has not split out yet. Those render without a
 * number rather than with an invented one — the brief marks every figure here
 * "(Insert updated statistics from MEL/database)", and a made-up statistic on a
 * page about vulnerable households is not a placeholder, it is a false claim.
 */
export type ReachFigure = {
  /** Slug of the label, used as the anchor on Our Impact. */
  id: string;
  label: string;
  value: number | null;
  caption: string;
  /** Revealed when someone points at the figure. */
  areas: string[];
  image: Img | null;
};

export type Reach = {
  figures: ReachFigure[];
  /** FXBVillage projects delivered to date. */
  projectsDelivered: number;
  /** Where the figures come from and when they were last updated. */
  note?: string;
};

function slug(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const getReach = cached("impact", "impact", async (): Promise<Reach> => {
  const payload = await cms();
  const doc = await payload.findGlobal({ slug: "impact", depth: 1 });

  return {
    figures: (doc.figures ?? []).map((figure) => ({
      id: slug(figure.label),
      label: figure.label,
      value: figure.value ?? null,
      caption: figure.caption,
      areas: (figure.areas ?? []).map((row) => row.item),
      image: image(figure.photo),
    })),
    projectsDelivered: doc.projectsDelivered,
    note: doc.note ?? undefined,
  };
});
