import manifest from "./partners.json";
import { cdn } from "./media";

/**
 * The partner, donor and government logos, delivered from the Bunny pull zone.
 *
 * The supplied files were 765x331 template cards — a blue frame hard against
 * the edge and a different amount of padding around every mark. Both are
 * stripped before upload so each logo is trimmed flush to its own bounds and
 * the slider alone decides the spacing. See `scripts/prepare-partner-logos.mjs`.
 *
 * Intrinsic dimensions travel with each entry: the aspect ratios here run from
 * 0.72 (NIRDA, a tall roundel) to 10.9 (The LEGO Foundation, a single line of
 * type), so the tile has to know the shape it is fitting.
 */
export type PartnerCategory =
  | "development"
  | "government"
  | "donor"
  | "corporate";

export type Partner = {
  /** Absolute CDN URL. */
  url: string;
  /** Storage path, e.g. `images/partners/nirda.png`. */
  src: string;
  slug: string;
  /** Organisation name, as it reads on the logo itself. */
  name: string;
  category: PartnerCategory;
  width: number;
  height: number;
};

/**
 * Names are transcribed from the marks themselves rather than expanded from
 * the supplied filenames, so nothing here is an invented legal name.
 */
const names: Record<string, string> = {
  ada: "Auto-Développement Afrique",
  augusta: "Augusta Energy",
  "bk-foundation": "BK Foundation",
  boston: "Boston College School of Social Work",
  e4impact: "E4Impact Foundation",
  "echidna-giving": "Echidna Giving",
  elma: "ELMA",
  "european-union": "European Union",
  "famille-lacoste": "Famille Réjane et Michel Lacoste",
  "fxb-global": "FXB Global",
  givedirectly: "GiveDirectly",
  gmo: "Gender Monitoring Office",
  "grand-challenge-canada": "Grand Challenges Canada",
  juanma: "Juanma Children Foundation",
  loda: "Local Administrative Entities Development Agency",
  "michele-bercet": "Fondation Michèle Berset",
  migeprof: "Ministry of Gender and Family Promotion",
  minaloc: "Ministry of Local Government",
  ncda: "National Child Development Agency",
  nirda: "National Industrial Research and Development Agency",
  "oak-foundation": "Oak Foundation",
  rab: "Rwanda Agriculture and Animal Resources Development Board",
  rbc: "Rwanda Biomedical Centre",
  "republic-of-rwanda": "Republic of Rwanda",
  rngof: "Rwanda NGOs Forum on HIV/AIDS & Health Promotion",
  "rrp-plus": "Rwanda Network of People Living with HIV/AIDS",
  skol: "Skol Brewery Limited",
  "solid-africa": "Solid Africa",
  "the-global-fund": "The Global Fund",
  "the-lego-foundation": "The LEGO Foundation",
  "the-light-foundation": "The Light Foundation",
  unaids: "UNAIDS",
  "valais-solidaire": "Valais Solidaire",
  "ville-de-paris": "Ville de Paris",
};

type ManifestEntry = {
  src: string;
  slug: string;
  category: PartnerCategory;
  width: number;
  height: number;
};

export const partners: Partner[] = (manifest as ManifestEntry[]).map(
  (entry) => {
    const name = names[entry.slug];
    // A logo with no name would ship an empty alt attribute, which is worse
    // than a build failure — fail loudly instead.
    if (!name) throw new Error(`Partner logo has no name: ${entry.slug}`);
    return { ...entry, name, url: cdn(entry.src) };
  }
);

/**
 * Presentation order. Development partners first — they are the organisations
 * FXB Rwanda delivers alongside — then the government mandate, then the funders.
 */
export const partnerCategories: {
  id: PartnerCategory;
  label: string;
}[] = [
  { id: "development", label: "Development Partners" },
  { id: "government", label: "Government" },
  { id: "donor", label: "Donors" },
  { id: "corporate", label: "Corporate Partners" },
];

export function partnersIn(category: PartnerCategory): Partner[] {
  return partners.filter((partner) => partner.category === category);
}

/**
 * Every partner in presentation order. The manifest is sorted alphabetically
 * by category, which puts corporate first for no reason anyone reading the page
 * would recognise; this walks the categories in the order above instead.
 */
export function orderedPartners(): Partner[] {
  return partnerCategories.flatMap((category) => partnersIn(category.id));
}
