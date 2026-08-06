import { eq } from "drizzle-orm";

import { db, globals } from "../db";
import type { ImpactData, SiteSettingsData } from "../db/schema";
import { bust } from "@/cms/revalidate";

/**
 * The two single documents.
 *
 * Both are one `jsonb` payload, so reading and writing them is reading and
 * writing one row. The forms are hand-built rather than generated: there are
 * exactly two of these, they have nested shapes the generic field system does
 * not cover, and a bespoke form for each is less code than the machinery that
 * would generate them.
 */

export const GLOBAL_SLUGS = {
  "site-details": "site-settings",
  impact: "impact",
} as const;

export type GlobalRoute = keyof typeof GLOBAL_SLUGS;

export const isGlobal = (slug: string): slug is GlobalRoute =>
  slug in GLOBAL_SLUGS;

export async function getGlobal<T>(route: GlobalRoute): Promise<T | null> {
  const slug = GLOBAL_SLUGS[route];
  const [row] = await db
    .select()
    .from(globals)
    .where(eq(globals.slug, slug))
    .limit(1);

  return (row?.data as T | undefined) ?? null;
}

async function put(route: GlobalRoute, data: unknown) {
  const slug = GLOBAL_SLUGS[route];
  await db
    .insert(globals)
    .values({ slug, data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: globals.slug,
      set: { data, updatedAt: new Date() },
    });

  bust(slug);
}

const str = (form: FormData, name: string) =>
  String(form.get(name) ?? "").trim();

/** One value per line, blanks dropped. */
const lines = (form: FormData, name: string) =>
  String(form.get(name) ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

/** The platforms the site's icon set covers. */
export const PLATFORMS = ["x", "linkedin", "instagram", "facebook", "youtube"] as const;

export async function saveSiteSettings(form: FormData) {
  const data: SiteSettingsData = {
    email: str(form, "email"),
    phone: str(form, "phone"),
    phoneHref: str(form, "phoneHref"),
    addressLine: str(form, "addressLine"),
    addressDistrict: str(form, "addressDistrict"),
    addressCountry: str(form, "addressCountry"),
    officeHours: str(form, "officeHours"),
    mapUrl: str(form, "mapUrl"),
    mapEmbedUrl: str(form, "mapEmbedUrl"),
    vision: str(form, "vision"),
    visionEmphasis: lines(form, "visionEmphasis"),
    mission: str(form, "mission"),
    values: lines(form, "values"),
    // A platform with no address is simply not a social link, so it drops out
    // rather than rendering an icon that goes nowhere.
    socials: PLATFORMS.map((platform) => ({
      platform,
      url: str(form, `social-${platform}`),
    })).filter((social) => social.url !== ""),
    externalSystems: lines(form, "externalSystems")
      .map((line) => {
        const [label, ...rest] = line.split("|");
        return { label: label.trim(), url: rest.join("|").trim() };
      })
      .filter((system) => system.label && system.url),
  };

  await put("site-details", data);
}

export async function saveImpact(form: FormData, figureCount: number) {
  const figures: ImpactData["figures"] = [];

  for (let index = 0; index < figureCount; index += 1) {
    const label = str(form, `figure-${index}-label`);
    if (!label) continue;

    const rawValue = str(form, `figure-${index}-value`);
    const photoId = str(form, `figure-${index}-photo`);

    figures.push({
      label,
      // Blank means MEL has not split this figure out. It stays null and the
      // site renders the block without a number, rather than inventing one.
      value: rawValue === "" ? null : Number(rawValue),
      caption: str(form, `figure-${index}-caption`),
      areas: lines(form, `figure-${index}-areas`),
      photoId: photoId === "" ? null : Number(photoId),
    });
  }

  const data: ImpactData = {
    figures,
    projectsDelivered: Number(str(form, "projectsDelivered") || 0),
    note: str(form, "note") || null,
  };

  await put("impact", data);
}
