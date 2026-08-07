/**
 * The text input, on a white ground.
 *
 * Shared rather than declared per form: the contact form and the newsletter
 * signup are the only two on the site, they sit one click apart, and a
 * twenty-class string copied into both is a guarantee that one of them ends up
 * with a different corner radius or focus colour after the next edit.
 *
 * Boxed here, underlined in the footer. Inside a solid colour room a bordered
 * box reads as a hole punched in the surface; on white a rule on its own does
 * not read as a field at all.
 */
export const field =
  "w-full rounded-card border border-gray-15 bg-white px-5 py-3.5 text-base text-gray transition-colors duration-300 outline-none placeholder:text-gray-80 focus:border-blue";
