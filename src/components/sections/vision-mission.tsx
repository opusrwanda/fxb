import {
  Award,
  BadgeCheck,
  Compass,
  Eye,
  Handshake,
  HeartHandshake,
  Lightbulb,
  type LucideIcon,
  Scale,
  ShieldCheck,
  Target,
  Telescope,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { getSection } from "@/cms/content/sections";
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
 * The values arrive from the brief as bare words and nothing else. They are set
 * as bare words. Writing a supporting sentence under each would mean inventing
 * organisational values on FXB Rwanda's behalf, which is not ours to do — the
 * numerals carry the rhythm instead.
 *
 * They read from the same global as the vision and mission. They were a literal
 * here until the 6 August 2026 revision of the brief added Accountability and
 * Creativity and Innovation, which settled the question of whether a board
 * revises them.
 *
 * That revision also cost the row its arithmetic: three values sat in three
 * columns, five sit in nothing. The grid is two up from `sm` and three from
 * `lg`, so the last row runs short rather than stretching — and because the
 * count is now editable, it has to hold for four or six as well. Wrapping is
 * the only rule that does.
 */

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
  // No phrases, no split. Joining an empty list gives `()`, which matches the
  // empty string between every character and shatters the sentence into single
  // letters. A vision with nothing stressed in it is a normal thing for the
  // team to set, so it cannot be allowed to render as debris.
  if (phrases.length === 0) {
    return <span className="font-normal text-white-94">{text}</span>;
  }

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

/**
 * An icon per value, matched on the word rather than the position.
 *
 * The values are editable — a board added Accountability and Creativity and
 * Innovation in the August revision — so a list keyed by index would silently
 * hand Teamwork's icon to whatever took its place. Matching on the first word
 * survives "Creativity and Innovation" being shortened to "Creativity", which
 * is the kind of edit that actually happens.
 *
 * Anything unrecognised gets the compass rose. A value with no icon of its own
 * still needs to sit in a row of cards that all have one, and a neutral mark is
 * better than a gap or a guess.
 */
const VALUE_ICONS: Record<string, LucideIcon> = {
  integrity: ShieldCheck,
  teamwork: HeartHandshake,
  honesty: BadgeCheck,
  accountability: Scale,
  creativity: Lightbulb,
  innovation: Lightbulb,
  transparency: Eye,
  respect: Handshake,
  excellence: Award,
  commitment: Target,
};

const iconFor = (value: string): LucideIcon => {
  const words = value.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  for (const word of words) {
    if (VALUE_ICONS[word]) return VALUE_ICONS[word];
  }
  return Compass;
};

export async function VisionMission({ details }: { details: SiteDetails }) {
  const copy = await getSection("who-we-are:vision");
  return (
    // 24/32 rather than 32/48. The room was padded for two columns of bare
    // text and a numbered list; the panels carry their own inset now, so the
    // old padding left a field of empty blue under the values.
    <section id="vision" className="scroll-mt-32 bg-blue py-24 lg:py-32">
      <Container>
        <Reveal className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <span className="h-0.5 w-6 bg-white-70" aria-hidden="true" />
            <span className="text-[24px] font-semibold tracking-[0.14em] text-white-94">
              {copy.eyebrow}
            </span>
          </div>
          {copy.heading && (
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-white lg:text-[42px] lg:leading-[1.08]">
              {copy.heading}
            </h2>
          )}
          {copy.body && (
            <p className="max-w-[62ch] text-base leading-relaxed text-white-94 lg:text-[17px]">
              {copy.body}
            </p>
          )}
        </Reveal>

        {/* Vision and mission as two panels rather than two columns of bare
            text on the ground.

            They were set straight onto the blue, which made the room one
            uninterrupted field of colour with words floating in it — the two
            statements read as one long paragraph broken by a heading. A panel
            gives each of them an edge, and the pair then reads as two things
            said rather than one thing said at length.

            `white/8` and not a second colour: the panel has to be visible
            against the blue without becoming a card in a different palette,
            and a tint of the ground itself is the only fill that cannot
            introduce one. */}
        <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <Reveal delay={140}>
            <div className="wedge flex h-full flex-col gap-6 bg-white/8 p-8 lg:p-10">
              <div className="flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/12">
                  <Telescope className="size-7 text-white" aria-hidden="true" />
                </span>
                <h2 className="text-xs font-semibold tracking-[0.14em] text-white-94">
                  OUR VISION
                </h2>
              </div>

              {/* Weight and white carry the emphasis, not a fifth colour and
                  not capitals. Both tokens used here clear AA on blue — the
                  quieter one is `white-94` at 4.61:1, not one of the
                  decorative alphas, because these are words and not a
                  hairline. */}
              <p className="text-[28px] leading-[1.25] tracking-[-0.03em] lg:text-[36px] lg:leading-[1.18]">
                {emphasise(details.vision, details.visionEmphasis)}
              </p>
            </div>
          </Reveal>

          <Reveal delay={290}>
            <div className="wedge flex h-full flex-col gap-6 bg-white/8 p-8 lg:p-10">
              <div className="flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/12">
                  <Compass className="size-7 text-white" aria-hidden="true" />
                </span>
                <h2 className="text-xs font-semibold tracking-[0.14em] text-white-94">
                  OUR MISSION
                </h2>
              </div>

              <p className="text-lg leading-relaxed text-white-94 lg:text-xl lg:leading-relaxed">
                {details.mission}
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={430} className="mt-16 lg:mt-20">
          <h2 className="text-xs font-semibold tracking-[0.14em] text-white-94">
            OUR GUIDING VALUES
          </h2>

          {/* The numerals are gone. They were carrying the rhythm because the
              values arrive from the brief as bare words with nothing under
              them — but a number in front of a value implies a ranking the
              board has not made, and an icon does the same structural job
              without claiming Integrity outranks Teamwork.

              Still two up from `sm` and three from `lg`, so the last row runs
              short rather than stretching. The count is editable and has to
              hold for four or six as well; wrapping is the only rule that
              does. */}
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {details.values.map((value) => {
              const Icon = iconFor(value);
              return (
                <li
                  key={value}
                  className="wedge flex items-center gap-5 bg-white/8 px-6 py-6"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/12">
                    <Icon className="size-6 text-white" aria-hidden="true" />
                  </span>
                  <span className="text-xl font-bold tracking-[-0.02em] text-white lg:text-[22px]">
                    {value}
                  </span>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
