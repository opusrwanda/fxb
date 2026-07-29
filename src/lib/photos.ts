import manifest from "./photos.json";
import { cdn } from "./media";

/**
 * The supplied photography, delivered from the Bunny pull zone.
 *
 * Originals were 24MP camera files totalling 318MB. Each is capped at 2400px
 * on the long edge and stripped of metadata before upload — camera serials and
 * GPS coordinates have no business on a public site, least of all one
 * photographing vulnerable households. See `scripts/prepare-photos.mjs`.
 *
 * Intrinsic dimensions travel with each entry so `next/image` can reserve
 * layout space and never shift the page as photographs arrive.
 */
export type Photo = {
  /** Absolute CDN URL. */
  url: string;
  /** Storage path, e.g. `images/fostering/fostering-01.jpg`. */
  src: string;
  group: PhotoGroup;
  width: number;
  height: number;
  orientation: "landscape" | "portrait";
};

export type PhotoGroup =
  | "fostering"
  | "fxbvillage-mageragere"
  | "fxbvillage-musambira"
  | "fxbvillage-tlf"
  | "itap-closing-rwamagana"
  | "sugira-muryango";

export const photos: Photo[] = (manifest as Omit<Photo, "url">[]).map(
  (photo) => ({ ...photo, url: cdn(photo.src) })
);

const byId = new Map(photos.map((photo) => [photoId(photo.src), photo]));

/** `images/fostering/fostering-01.jpg` -> `fostering-01` */
function photoId(src: string): string {
  return src.split("/").pop()!.replace(/\.jpg$/, "");
}

/**
 * Look up a photo by its id, e.g. `photo("sugira-muryango-01")`.
 * Throws rather than rendering a broken image — a missing photograph is a
 * content error worth failing the build over, not something to paper over.
 */
export function photo(id: string): Photo {
  const found = byId.get(id);
  if (!found) throw new Error(`Unknown photo: ${id}`);
  return found;
}

export function photosIn(group: PhotoGroup): Photo[] {
  return photos.filter((p) => p.group === group);
}
