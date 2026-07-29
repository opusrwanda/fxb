/**
 * The page measure.
 *
 * Colour rooms stay full-bleed — that is the whole point of the rhythm — so
 * this constrains content only. 1280px with 40px gutters gives a 1200px
 * measure at large sizes, which keeps the display headlines and the seven-digit
 * impact figures from spanning an ultrawide monitor.
 */
export function Container({
  children,
  className = "",
  ...rest
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      {...rest}
      className={`mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-10 ${className}`}
    >
      {children}
    </div>
  );
}
