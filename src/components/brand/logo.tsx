import Image from "next/image";

/**
 * The FXB Rwanda lockup.
 *
 * Note this is the logo the Brand Guiding Tool labels "OLD VERSION (TO BE
 * CHANGED LATER)" — it still carries the "Ending Poverty, Restoring Dignity"
 * tagline that the newer lockup drops. Swapping it later is a one-file change:
 * replace the two files in `public/img/` and nothing else moves.
 *
 * The white variant is derived from the colour file's alpha channel, since the
 * supplied asset had no white monochrome version. It is what runs on the
 * transparent header, inside the blue rooms and in the footer.
 *
 * Size it by height — `className="h-14"` — and let the width follow. The
 * lockup is 2606 × 882, so roughly 2.95 : 1.
 */
export function Logo({
  variant = "colour",
  className = "",
  alt = "FXB Rwanda",
  priority = false,
}: {
  variant?: "colour" | "white";
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={variant === "white" ? "/img/logo-white.png" : "/img/logo-colour.png"}
      alt={alt}
      // Display size rather than the file's intrinsic 2606 × 882, so the HTML
      // attributes alone hold the lockup at a sane size. Without this, any
      // moment where the stylesheet has not applied — a stale dev cache, a
      // slow CSS response — paints a 2606px logo across the whole viewport.
      width={165}
      height={56}
      priority={priority}
      sizes="260px"
      className={`w-auto ${className}`}
    />
  );
}
