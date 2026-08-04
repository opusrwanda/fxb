import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui/reveal";
import type { SiteDetails } from "@/cms/content/settings";

/**
 * Vision, Mission & Values — the blue room.
 *
 * Vision and mission are the revised wording the client supplied in the margin
 * of the content brief, not the older statements in the body text. Both are in
 * the Site details global now — they are the two sentences a board is most
 * likely to revise — and read from one place, so nothing that quotes them can
 * drift out of step.
 *
 * The vision carries emphasis, the mission does not. The client writes the
 * vision as EMPOWERED and RESILIENT COMMUNITIES shaping their OWN FUTURE — three
 * ideas in capitals with the joins in lower case — and that structure is the
 * statement. Setting it flat threw all nine words at the reader at once; this
 * way the three ideas land first and the sentence reads underneath them.
 *
 * The three values arrive from the brief as three words and nothing else. They
 * are set as three words. Writing a supporting sentence under each would mean
 * inventing organisational values on FXB Rwanda's behalf, which is not ours to
 * do — the numerals carry the rhythm instead.
 */
const values = ["Integrity", "Teamwork", "Honesty"];

/**
 * Splits the vision around its emphasised phrases.
 *
 * Case-insensitive, because "Empowered" opens the sentence and is capitalised
 * there but would not be mid-sentence — matching on case would silently drop an
 * emphasis the day the wording is reordered.
 *
 * `<strong>` rather than a styled span: these are genuinely the stressed terms
 * of the sentence, so the emphasis should survive being read aloud or having
 * the stylesheet fail, not just being looked at.
 */
function emphasise(text: string, phrases: readonly string[]) {
  const escaped = phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const lowered = phrases.map((p) => p.toLowerCase());

  return text
    .split(new RegExp(`(${escaped.join("|")})`, "gi"))
    .filter(Boolean)
    .map((part, index) =>
      lowered.includes(part.toLowerCase()) ? (
        <strong key={index} className="font-bold text-white">
          {part}
        </strong>
      ) : (
        <span key={index} className="font-normal text-white-94">
          {part}
        </span>
      )
    );
}

export function VisionMission({ details }: { details: SiteDetails }) {
  return (
    <section id="vision" className="scroll-mt-32 bg-blue py-32 lg:py-48">
      <Container>
        <Reveal className="flex items-center gap-4">
          <span className="h-0.5 w-6 bg-white-70" aria-hidden="true" />
          <span className="text-xs font-semibold tracking-[0.14em] text-white-94">
            VISION, MISSION & VALUES
          </span>
        </Reveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal delay={80}>
            <h2 className="text-xs font-semibold tracking-[0.14em] text-white-94">
              OUR VISION
            </h2>
            {/* Weight and white carry the emphasis, not a fifth colour and not
                capitals. Both tokens used here clear AA on blue — the quieter
                one is `white-94` at 4.61:1, not one of the decorative alphas,
                because these are words and not a hairline. */}
            <p className="mt-5 text-3xl leading-[1.25] tracking-[-0.03em] lg:text-[40px] lg:leading-[1.15]">
              {emphasise(details.vision, details.visionEmphasis)}
            </p>
          </Reveal>

          <Reveal delay={160}>
            <h2 className="text-xs font-semibold tracking-[0.14em] text-white-94">
              OUR MISSION
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white-94 lg:text-xl lg:leading-relaxed">
              {details.mission}
            </p>
          </Reveal>
        </div>

        <Reveal delay={240} className="mt-16 lg:mt-24">
          <div className="h-px w-full bg-white-12" aria-hidden="true" />
          <h2 className="mt-12 text-xs font-semibold tracking-[0.14em] text-white-94">
            OUR GUIDING VALUES
          </h2>
          <ul className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
            {values.map((value, index) => (
              <li key={value} className="flex items-baseline gap-5">
                <span
                  className="text-sm font-semibold text-white-94"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-2xl font-bold tracking-[-0.02em] text-white lg:text-[28px]">
                  {value}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
