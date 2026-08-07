import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui/reveal";

/**
 * The opening statement, and the case for it.
 *
 * Two rooms in one file because they are one argument: what we do, then why it
 * has to be done that way. The white room states the approach; the blue room
 * underneath it is the challenge the approach exists to answer, and putting the
 * bleaker copy on colour keeps it from reading as a footnote to the optimism
 * above.
 *
 * "FXBVillage Model" links down to the model itself, per the brief's note.
 *
 * The approach room used to run the site's label-rail pattern — eyebrow and
 * heading in four columns, prose in seven. It was the wrong pattern for this
 * particular heading: "Empowering communities through integrated development"
 * is fifty-two characters, and in a 280px rail it broke over five lines, one
 * word per line, with three hundred and eighty pixels of white underneath it.
 * The heading now gets half the measure and sets in two.
 */

/**
 * The sectors the work spans, exactly as the brief names them.
 *
 * They were inside the third paragraph — nine sectors in a single sentence,
 * between an em-dash pair, which is the least scannable place on the page for
 * the most concrete thing in the section. Nobody reads a nine-item list set as
 * prose; they read the first two and skip to the full stop.
 *
 * Lifting them out costs the sentence nothing. It still reads "we work across
 * multiple sectors to create sustainable and lasting impact" — only the
 * parenthetical inventory moves, and every sector keeps its own wording.
 *
 * Not linked. Four of the nine roughly correspond to an area of intervention
 * further down and five do not, and a link that lands somewhere approximately
 * related is worse than no link at all.
 */
const SECTORS = [
  "Child protection",
  "Education",
  "Health",
  "Nutrition",
  "Economic empowerment",
  "Agriculture",
  "Water and sanitation",
  "Climate resilience",
  "Community health",
];
export function Approach() {
  return (
    <>
      <section id="approach" className="scroll-mt-36 bg-white py-24 lg:py-32">
        <Container>
          {/* Heading across half the measure, statement across the rest. The
              statement is the one sentence in the section worth reading if you
              read nothing else, so it sits level with the heading rather than
              queued behind it. */}
          <div className="grid gap-y-8 lg:grid-cols-12 lg:gap-x-10">
            <Reveal className="lg:col-span-6">
              <div className="flex items-center gap-4">
                <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
                <span className="text-[24px] font-semibold tracking-[0.14em] text-gray-80">
                  OUR APPROACH
                </span>
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-[-0.03em] text-balance text-blue lg:text-[42px] lg:leading-[1.08]">
                Empowering communities through integrated development
              </h2>
            </Reveal>

            <Reveal delay={140} className="lg:col-span-5 lg:col-start-8">
              <p className="text-xl leading-[1.45] font-medium text-blue lg:text-[23px]">
                At FXB Rwanda, we believe that lasting change happens when
                families and communities are equipped with the knowledge,
                skills, and opportunities they need to thrive.
              </p>
            </Reveal>
          </div>

          {/* Two paragraphs, two columns. Stacked in one column they were a
              400-pixel grey run in the middle of the page with nothing to
              break it; side by side each is four lines and reads at a glance. */}
          <div className="mt-14 grid gap-x-10 gap-y-6 lg:mt-16 lg:grid-cols-2 lg:gap-x-16">
            <Reveal delay={290}>
              <p className="max-w-[54ch] text-base leading-relaxed text-gray lg:text-[17px]">
                Our work goes beyond addressing immediate needs. We implement
                integrated, community-centred programmes that strengthen
                resilience, promote self-reliance, and improve the well-being of
                vulnerable children and families.
              </p>
            </Reveal>

            <Reveal delay={430}>
              <p className="max-w-[54ch] text-base leading-relaxed text-gray lg:text-[17px]">
                Whether responding to urgent challenges or investing in
                long-term development, our goal remains the same: to create a
                world where every child grows up in a safe, healthy, and
                supportive environment.
              </p>
            </Reveal>
          </div>

          <Reveal delay={580} className="mt-16 lg:mt-24">
            <p className="max-w-[54ch] text-base leading-relaxed text-gray lg:text-[17px]">
              Guided by the{" "}
              <Link
                href="#fxbvillage-model"
                className="font-medium text-blue underline underline-offset-4 transition-colors duration-300 hover:text-green"
              >
                FXBVillage Model
              </Link>
              , we work across multiple sectors to create sustainable and
              lasting impact.
            </p>

            {/* Nine sectors on a three-by-three, each on its own rule. The
                repeated hairline is what turns nine words into a set you can
                count — as a wrapped run of chips they would have read as tags,
                and these are the whole span of the organisation's work. */}
            <ul className="mt-10 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-16">
              {SECTORS.map((sector) => (
                <li
                  key={sector}
                  className="border-t border-gray-15 py-5 text-lg leading-snug font-medium text-blue lg:py-6 lg:text-xl"
                >
                  {sector}
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>

      <section id="challenge" className="scroll-mt-36 bg-blue py-24 lg:py-32">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-10">
            <Reveal className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
              <div className="flex items-center gap-4">
                <span className="h-0.5 w-6 bg-white-70" aria-hidden="true" />
                <span className="text-[24px] font-semibold tracking-[0.14em] text-white-94">
                  THE CHALLENGE
                </span>
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-[-0.03em] text-white lg:text-[42px] lg:leading-[1.08]">
                The challenge of child poverty
              </h2>
            </Reveal>

            <Reveal delay={140} className="flex flex-col gap-6 lg:col-span-7 lg:col-start-6">
              <p className="max-w-[58ch] text-base leading-relaxed text-white-94 lg:text-[17px]">
                Among the most disadvantaged groups in society, children are
                particularly vulnerable to the many consequences of poverty that
                affect families and communities. Income insecurity, hunger, poor
                health, marginalisation, illiteracy, and the lack of sanitation
                and adequate housing are both causes and consequences of
                poverty, pulling families into a downward spiral of deprivation.
              </p>

              <p className="max-w-[58ch] text-base leading-relaxed text-white-94 lg:text-[17px]">
                Poverty experienced by children, even for short periods, can
                leave lasting marks throughout their lives. In the most severe
                situations, some do not survive. Those who do may suffer from
                early childhood onward, from malnutrition, insecurity, and
                multiple forms of deprivation, with lasting effects on their
                health and cognitive development. These consequences compromise
                their potential in adulthood and weaken the well-being of future
                generations.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
