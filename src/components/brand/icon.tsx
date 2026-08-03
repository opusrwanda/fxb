import icons from "@/lib/icons.json";

/**
 * The brand icon set, from the Brand Guiding Tool.
 *
 * The guide draws every icon four times — blue, green, gray, white — because
 * the same drawing has to sit on any of the four sanctioned grounds. Shipping
 * four rasters each would have been four files to keep in step, and still no
 * way to put one on a photograph where the ground is not any of the four.
 *
 * So what ships is the drawing with the colour taken out: an alpha mask,
 * painted here by `bg-current`. The icon inherits whatever `color` its parent
 * carries, which means `text-blue` on white, `text-white` in a colour room,
 * `text-green` if the guide ever sanctions it, and a hover state costs nothing.
 * One file covers every column of the guide's grid.
 *
 * Both prefixed and unprefixed mask properties are set. The unprefixed form is
 * what every current engine uses; the `-webkit-` pair is there for older Safari,
 * where the icon would otherwise be a solid coloured square rather than absent
 * — a failure worth two extra lines to avoid.
 *
 * Decorative by default. These sit beside the heading they illustrate, so
 * announcing "health" immediately before a heading that says Health is noise.
 * Pass a `label` only where the icon is the sole thing carrying the meaning.
 *
 * See `scripts/prepare-icons.mjs` for how the masks come out of the PDF.
 */
export type IconId = (typeof icons)[number]["id"];

const byId = new Map(icons.map((icon) => [icon.id, icon]));

export function BrandIcon({
  id,
  className = "size-12",
  label,
}: {
  id: IconId;
  /** Size and colour. Colour comes from `color`, so any text utility works. */
  className?: string;
  /** Set only when nothing beside the icon carries its meaning. */
  label?: string;
}) {
  const icon = byId.get(id);

  // Same contract as `photo()`: a missing asset is a content error worth
  // failing the build over, not a silently empty box on a live page.
  if (!icon) throw new Error(`Unknown brand icon: ${id}`);

  const mask = `url(${icon.src}) center / contain no-repeat`;

  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`block shrink-0 bg-current ${className}`}
      style={{ mask, WebkitMask: mask }}
    />
  );
}
