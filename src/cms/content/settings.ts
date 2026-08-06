import { eq } from "drizzle-orm";

import { db, globals } from "@/staff/db";
import { DEFAULT_VALUES, type SiteSettingsData } from "@/staff/db/schema";
import { brand } from "@/lib/site";
import { cached } from "./cache";

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
    };
  },
);
