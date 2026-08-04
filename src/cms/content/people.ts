import { asc, eq } from "drizzle-orm";

import { board, db, media, partners } from "@/staff/db";
import { cached } from "./cache";
import { image, type Img } from "./image";

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
 * meaningful, which is why order is a required field.
 */
export const getBoard = cached("board", "board", async (): Promise<BoardMember[]> => {
  const rows = await db
    .select({ member: board, portrait: media })
    .from(board)
    .leftJoin(media, eq(board.portraitId, media.id))
    .orderBy(asc(board.order));

  return rows.map(({ member, portrait }) => ({
    name: member.name,
    role: member.role,
    portrait: image(portrait),
  }));
});

export type PartnerCategory = "development" | "government" | "donor" | "corporate";

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

export const getPartners = cached("partners", "partners", async (): Promise<Partner[]> => {
  const rows = await db
    .select({ partner: partners, logo: media })
    .from(partners)
    .leftJoin(media, eq(partners.logoId, media.id))
    .orderBy(asc(partners.name));

  return rows.map(({ partner, logo }) => ({
    name: partner.name,
    category: partner.category as PartnerCategory,
    logo: image(logo),
    url: partner.url ?? undefined,
  }));
});

export async function getPartnersIn(category: PartnerCategory): Promise<Partner[]> {
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
  const all = await getPartners();
  return partnerCategories.flatMap((category) =>
    all.filter((partner) => partner.category === category.id),
  );
}
