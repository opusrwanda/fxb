import Image from "next/image";

import type { Section } from "@/cms/content/sections";
import { Reveal } from "@/components/ui/reveal";

/**
 * A section's own heading block, and the ground it sits on.
 *
 * These two are here because the same twelve lines were written into every
 * band on the site — the tracked line above, the heading, the sentence under
 * it — and every one of them held its words as literals. Rewording "Four areas
 * of intervention" meant a developer and a deploy, which is exactly what
 * Section text exists to prevent and was only true of three sections out of
 * twenty-five.
 *
 * Now a section reads its copy, its background and its blocks from one call
 * and passes the result here.
 */

/**
 * The eyebrow, the heading and the paragraph under it.
 *
 * Every part is optional and simply absent when the section has nothing for
 * it, so a band with a heading and no introduction does not render an empty
 * paragraph — and clearing a field in the panel takes the element away rather
 * than leaving a gap where it was.
 */
export function SectionHeading({
  section,
  className = "",
  tone = "dark",
}: {
  section: Section;
  className?: string;
  /**
   * `light` for a band on blue or over a photograph.
   *
   * A colour rather than a class so the caller cannot half-apply it — the
   * heading and the paragraph have to change together, and passing them
   * separately is how a white heading ends up over grey body text.
   */
  tone?: "dark" | "light";
}) {
  const light = tone === "light";

  return (
    <Reveal className={`flex flex-col gap-5 ${className}`}>
      {section.eyebrow && (
        <div className="flex items-center gap-4">
          <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
          <span
            className={`text-xs font-semibold tracking-[0.14em] ${
              light ? "text-white-70" : "text-gray-80"
            }`}
          >
            {section.eyebrow}
          </span>
        </div>
      )}

      {section.heading && (
        <h2
          className={`text-3xl font-bold tracking-[-0.03em] lg:text-[42px] lg:leading-[1.08] ${
            light ? "text-white" : "text-blue"
          }`}
        >
          {section.heading}
        </h2>
      )}

      {section.body && (
        <p
          className={`max-w-[62ch] text-base leading-relaxed lg:text-[17px] ${
            light ? "text-white-94" : "text-gray"
          }`}
        >
          {section.body}
        </p>
      )}
    </Reveal>
  );
}

/**
 * A section, with the photograph behind it if one has been chosen.
 *
 * NOTHING CHANGES UNTIL SOMEBODY CHOOSES ONE. With no picture this renders the
 * plain `<section>` the site has always had, with whatever ground its own
 * classes give it. That is what makes the field safe to offer on every section
 * including the white ones: the control exists everywhere and does nothing
 * until it is used.
 *
 * A scrim comes with the picture, not as an option. A photograph behind body
 * text is a contrast failure waiting for the wrong upload, and leaving that to
 * whoever picks the file means the first dark image makes a section unreadable.
 * So the text switches to its light tone and the picture is darkened enough to
 * carry it — the two are one decision.
 */
export function SectionBand({
  section,
  id,
  className = "",
  children,
}: {
  section: Section;
  id?: string;
  /** The ground and spacing the section has when it carries no photograph. */
  className?: string;
  children: React.ReactNode;
}) {
  if (!section.image) {
    return (
      <section id={id} className={className}>
        {children}
      </section>
    );
  }

  return (
    <section id={id} className={`relative isolate overflow-hidden ${className}`}>
      <Image
        src={section.image.url}
        // Decorative: a background carries no information the words do not.
        // A photograph that is genuinely part of the argument belongs in the
        // section's own markup where it can be described.
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-blue/75" aria-hidden="true" />
      {children}
    </section>
  );
}

/** Does this section carry a chosen photograph? Decides the text's tone. */
export const bandTone = (section: Section): "dark" | "light" =>
  section.image ? "light" : "dark";
