import Link from "next/link";

/**
 * The pill — every action in the system is one of these.
 *
 * Hairline borders and a medium-weight label, not 2px and semibold: at this
 * size a heavy outline reads as a warning, and the restraint is what lets the
 * one solid button on a screen carry the emphasis. Padding is generous
 * horizontally and modest vertically, so the shape stays wide and calm.
 */
/**
 * `brightness-110` is not a hover state, it is a filter applied to a brand
 * colour — it lifts #0472c2 off the sanctioned blue and #008d00 off the
 * sanctioned green for as long as the cursor is there. Both now darken to a
 * defined alpha of their own hue instead, which stays inside the palette.
 */
const variants = {
  /** Primary action. One per screen. */
  primary: "bg-blue text-white hover:bg-blue-90",
  /** Donate, and nothing else — the only green fill in the system. */
  donate: "bg-green text-white hover:bg-green/90",
  /** Secondary, on white. */
  outline: "border border-blue text-blue hover:bg-blue hover:text-white",
  /** Secondary, inside a colour room or over footage. */
  outlineLight: "border border-white text-white hover:bg-white hover:text-blue",
  /** Primary, inside a colour room. */
  white: "bg-white text-blue hover:bg-white-70",
} as const;

// Weight lives here, not on the base class: with `font-medium` in the base and
// `font-bold` on the donate size, both land in the class list for the same
// property and which one wins is down to CSS source order, not intent.
const sizes = {
  sm: "px-5 py-2.5 text-sm font-medium",
  md: "px-6 py-3 text-sm font-medium",
  lg: "px-7 py-3 text-base font-medium",
} as const;

/**
 * Donate ignores the size scale, and has to.
 *
 * White on #008d00 is 4.37:1 — under the 4.5:1 that normal-weight body text is
 * held to, and the green is brand-locked so it cannot be darkened. The only
 * lever left is type size: at 19px bold the label qualifies as large text and
 * is held to 3:1 instead, which it clears comfortably. That the primary
 * conversion action ends up bigger and bolder than its neighbours is not a
 * cost.
 */
const DONATE_SIZE = "px-7 py-3 text-[19px] font-bold";

export function Pill({
  href,
  children,
  variant = "outline",
  size = "md",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full whitespace-nowrap transition-colors duration-300 ${variants[variant]} ${
        variant === "donate" ? DONATE_SIZE : sizes[size]
      } ${className}`}
    >
      {children}
    </Link>
  );
}
