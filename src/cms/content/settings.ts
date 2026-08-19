import { eq } from "drizzle-orm";

import { inArray } from "drizzle-orm";

import { db, globals, media } from "@/staff/db";
import { DEFAULT_VALUES, type SiteSettingsData } from "@/staff/db/schema";
import { brand } from "@/lib/site";
import { cached } from "./cache";
import { image, type Img } from "./image";

/** The platforms the icon set covers, and how each is named to a screen reader. */
const socialLabels: Record<string, string> = {
  x: "X",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
};

export type SiteDetails = typeof brand & {
  email: string;
  phone: string;
  /** For the tap-to-call link, no spaces. */
  phoneHref: string;
  address: { line: string; district: string; country: string };
  officeHours: string;
  mapUrl: string;
  mapEmbedUrl: string;
  vision: string;
  /** The phrases to stress in the vision, exactly as they appear in it. */
  visionEmphasis: string[];
  mission: string;
  /** The guiding values, in the order they are shown. */
  values: string[];
  socials: { label: string; href: string; icon: string }[];
  externalSystems: { label: string; href: string }[];
  /**
   * The lockup, or null where the shipped file still stands.
   *
   * Null is the answer, not a failure: `Logo` draws `public/img` when it is
   * given nothing, which is what keeps the site looking exactly as it does
   * until somebody uploads one.
   */
  logos: { colour: Img | null; white: Img | null };
  /** Offices other than the head office, in the order they were entered. */
  subOffices: { name: string; location: string; mapUrl?: string }[];
};

/**
 * The details that appear on every page.
 *
 * Brand constants and edited content in one object, because the distinction is
 * ours and not the reader's — the footer wants the organisation's legal name
 * and its phone number side by side, and should not have to know that one is
 * compiled in and the other came out of Postgres.
 */
export const getSiteDetails = cached(
  "site-settings",
  "site-settings",
  async (): Promise<SiteDetails> => {
    const [row] = await db
      .select()
      .from(globals)
      .where(eq(globals.slug, "site-settings"))
      .limit(1);

    const data = row?.data as SiteSettingsData;

    /**
     * Both lockups in one query, and only when one has been chosen.
     *
     * `inArray` with an empty list is a query that cannot match anything, so
     * the common case — nobody has uploaded a logo and the shipped files stand
     * — does not go to the database at all.
     */
    const logoIds = [data.logoColourId, data.logoWhiteId].filter(
      (id): id is number => typeof id === "number",
    );
    const rows = logoIds.length
      ? await db.select().from(media).where(inArray(media.id, logoIds))
      : [];
    const logo = (id?: number | null) =>
      image(rows.find((row) => row.id === id)) ?? null;

    return {
      ...brand,
      email: data.email,
      phone: data.phone,
      phoneHref: data.phoneHref,
      address: {
        line: data.addressLine,
        district: data.addressDistrict,
        country: data.addressCountry,
      },
      officeHours: data.officeHours,
      mapUrl: data.mapUrl,
      mapEmbedUrl: data.mapEmbedUrl,
      vision: data.vision,
      visionEmphasis: data.visionEmphasis ?? [],
      mission: data.mission,
      // `?? `, not `||` on a length check: an editor who saves an empty box has
      // not asked for the defaults back, but a row that predates the field has
      // no opinion either way.
      values: data.values ?? DEFAULT_VALUES,
      socials: (data.socials ?? []).map((social) => ({
        label: socialLabels[social.platform] ?? social.platform,
        href: social.url,
        icon: social.platform,
      })),
      externalSystems: (data.externalSystems ?? []).map((system) => ({
        label: system.label,
        href: system.url,
      })),
      subOffices: data.subOffices ?? [],
      logos: { colour: logo(data.logoColourId), white: logo(data.logoWhiteId) },
    };
  },
);
