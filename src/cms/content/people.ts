import type { Board, Partner as PartnerDoc } from "../payload-types";
import { image, type Img } from "./image";
import { cached, cms } from "./payload";

/** A member of the Board of Directors. */
export type BoardMember = {
  /** As supplied, honorifics and post-nominals included. */
  name: string;
  role: string;
  portrait: Img | null;
};

/**
 * The board, by office rather than alphabetically — Chairperson, Vice
 * Chairperson, Executive Director, Secretary, then advisors. That sequence is
 * meaningful, which is why `order` is a required field on the collection.
 */
export const getBoard = cached("board", "board", async (): Promise<BoardMember[]> => {
  const payload = await cms();
  const { docs } = await payload.find({
    collection: "board",
    sort: "order",
    depth: 1,
    limit: 0,
    pagination: false,
  });

  return docs.map((doc: Board) => ({
    name: doc.name,
    role: doc.role,
    portrait: image(doc.portrait),
  }));
});

export type PartnerCategory =
  | "development"
  | "government"
  | "donor"
  | "corporate";

export type Partner = {
  name: string;
  category: PartnerCategory;
  logo: Img | null;
  /** Their website, where the wall should link out. */
  url?: string;
};

/**
 * Presentation order. Development partners first — the organisations FXB
 * Rwanda delivers alongside — then the government mandate, then the funders.
 */
export const partnerCategories: { id: PartnerCategory; label: string }[] = [
  { id: "development", label: "Development Partners" },
  { id: "government", label: "Government" },
  { id: "donor", label: "Donors" },
  { id: "corporate", label: "Corporate Partners" },
];

export const getPartners = cached(
  "partners",
  "partners",
  async (): Promise<Partner[]> => {
    const payload = await cms();
    const { docs } = await payload.find({
      collection: "partners",
      sort: "name",
      depth: 1,
      limit: 0,
      pagination: false,
    });

    return docs.map((doc: PartnerDoc) => ({
      name: doc.name,
      category: doc.category,
      logo: image(doc.logo),
      url: doc.url ?? undefined,
    }));
  },
);

export async function getPartnersIn(
  category: PartnerCategory,
): Promise<Partner[]> {
  return (await getPartners()).filter((partner) => partner.category === category);
}

/**
 * Every partner in presentation order.
 *
 * The query sorts alphabetically, which puts a corporate sponsor next to a
 * government ministry for no reason anyone reading the page would recognise.
 * This walks the categories above instead, alphabetical within each.
 */
export async function getOrderedPartners(): Promise<Partner[]> {
  const partners = await getPartners();
  return partnerCategories.flatMap((category) =>
    partners.filter((partner) => partner.category === category.id),
  );
}
