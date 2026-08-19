import Image from "next/image";

import type { Img } from "@/cms/content/image";

/**
 * The FXB Rwanda lockup.
 *
 * The shipped files are the ones the Brand Guiding Tool labels "OLD VERSION (TO
 * BE CHANGED LATER)" — they still carry the "Ending Poverty, Restoring Dignity"
 * tagline the newer lockup drops. Swapping them was a developer and a deploy
 * until the pair moved into Site details; pass `logo` and this draws that
 * instead, and passing nothing draws what is in `public/img`.
 *
 * The white variant is derived from the colour file's alpha channel, since the
 * supplied asset had no white monochrome version. It is what runs on the
 * transparent header, inside the blue rooms and in the footer — a different
 * drawing rather than a colour setting, which is why the panel takes two files.
 *
 * Size it by height — `className="h-14"` — and let the width follow. The
 * shipped lockup is 2606 × 882, roughly 2.95 : 1; an uploaded one brings its
 * own dimensions so a lockup of another shape is not squeezed into that ratio.
 */
export function Logo({
  variant = "colour",
  logo,
  className = "",
  alt = "FXB Rwanda",
  priority = false,
}: {
  variant?: "colour" | "white";
  /** The uploaded lockup for this variant, from Site details. */
  logo?: Img | null;
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  const src =
    logo?.url ??
    (variant === "white" ? "/img/logo-white.png" : "/img/logo-colour.png");

  /**
   * A display size rather than the file's intrinsic one.
   *
   * Without width and height, any moment where the stylesheet has not applied —
   * a stale dev cache, a slow CSS response — paints a 2606px logo across the
   * whole viewport. 56 high with the width scaled to the file's own ratio: the
   * pair only has to describe the shape, since `w-auto` and the caller's `h-*`
   * decide the size.
   */
  const height = 56;
  const width =
    logo?.width && logo.height
      ? Math.round((logo.width / logo.height) * height)
      : 165;

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes="260px"
      className={`w-auto ${className}`}
    />
  );
}
