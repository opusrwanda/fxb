import { brand } from "@/lib/site";
import { cached, cms } from "./payload";

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
 *
 * What stays compiled in is what changing would mean rebranding: the name, the
 * legal entity, the FXB Global endorsement. Everything a board or an office
 * move can change is in `/staff`.
 */
export const getSiteDetails = cached(
  "site-settings",
  "site-settings",
  async (): Promise<SiteDetails> => {
    const payload = await cms();
    const doc = await payload.findGlobal({ slug: "site-settings", depth: 0 });

    return {
      ...brand,
      email: doc.email,
      phone: doc.phone,
      phoneHref: doc.phoneHref,
      address: {
        line: doc.addressLine,
        district: doc.addressDistrict,
        country: doc.addressCountry,
      },
      officeHours: doc.officeHours,
      mapUrl: doc.mapUrl,
      mapEmbedUrl: doc.mapEmbedUrl,
      vision: doc.vision,
      visionEmphasis: (doc.visionEmphasis ?? []).map((row) => row.phrase),
      mission: doc.mission,
      socials: (doc.socials ?? []).map((social) => ({
        label: socialLabels[social.platform] ?? social.platform,
        href: social.url,
        icon: social.platform,
      })),
      externalSystems: (doc.externalSystems ?? []).map((system) => ({
        label: system.label,
        href: system.url,
      })),
    };
  },
);
