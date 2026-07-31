import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui/reveal";
import { org } from "@/lib/site";

/**
 * Vision, Mission & Values — the blue room.
 *
 * Vision and mission are the revised wording the client supplied in the margin
 * of the content brief, not the older statements in the body text; both live in
 * `site.ts` so the footer and this section can never drift apart.
 *
 * The three values arrive from the brief as three words and nothing else. They
 * are set as three words. Writing a supporting sentence under each would mean
 * inventing organisational values on FXB Rwanda's behalf, which is not ours to
 * do — the numerals carry the rhythm instead.
 */
const values = ["Integrity", "Teamwork", "Honesty"];

export function VisionMission() {
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
            <p className="mt-5 text-3xl leading-[1.25] font-bold tracking-[-0.03em] text-white lg:text-[40px] lg:leading-[1.15]">
              {org.vision}
            </p>
          </Reveal>

          <Reveal delay={160}>
            <h2 className="text-xs font-semibold tracking-[0.14em] text-white-94">
              OUR MISSION
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white-94 lg:text-xl lg:leading-relaxed">
              {org.mission}
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
