import Link from "next/link";

/**
 * The pill — every action in the system is one of these.
 *
 * Hairline borders and a medium-weight label, not 2px and semibold: at this
 * size a heavy outline reads as a warning, and the restraint is what lets the
 * one solid button on a screen carry the emphasis. Padding is generous
 * horizontally and modest vertically, so the shape stays wide and calm.
 */
const variants = {
  /** Primary action. One per screen. */
  primary: "bg-blue text-white hover:brightness-110",
  /** Donate, and nothing else — the only green fill in the system. */
  donate: "bg-green text-white hover:brightness-110",
  /** Secondary, on white. */
  outline: "border border-blue text-blue hover:bg-blue hover:text-white",
  /** Secondary, inside a colour room or over footage. */
  outlineLight: "border border-white text-white hover:bg-white hover:text-blue",
  /** Primary, inside a colour room. */
  white: "bg-white text-blue hover:bg-white-70",
} as const;

const sizes = {
  sm: "px-5 py-2.5 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-7 py-3 text-base",
} as const;

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
      className={`inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap transition-colors duration-200 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </Link>
  );
}
