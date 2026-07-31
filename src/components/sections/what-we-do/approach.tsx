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
 */
export function Approach() {
  return (
    <>
      <section className="bg-white py-24 lg:py-32">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-10">
            <Reveal className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
              <div className="flex items-center gap-4">
                <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
                <span className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                  OUR APPROACH
                </span>
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[42px] lg:leading-[1.08]">
                Empowering communities through integrated development
              </h2>
            </Reveal>

            <Reveal delay={80} className="flex flex-col gap-6 lg:col-span-7 lg:col-start-6">
              <p className="max-w-[38ch] text-2xl leading-[1.4] font-medium text-blue lg:text-[28px]">
                At FXB Rwanda, we believe that lasting change happens when
                families and communities are equipped with the knowledge,
                skills, and opportunities they need to thrive.
              </p>

              <p className="max-w-[58ch] text-base leading-relaxed text-gray lg:text-[17px]">
                Our work goes beyond addressing immediate needs. We implement
                integrated, community-centred programmes that strengthen
                resilience, promote self-reliance, and improve the well-being of
                vulnerable children and families.
              </p>

              <p className="max-w-[58ch] text-base leading-relaxed text-gray lg:text-[17px]">
                Guided by the{" "}
                <Link
                  href="#fxbvillage-model"
                  className="font-medium text-blue underline underline-offset-4 transition-colors duration-200 hover:text-green"
                >
                  FXBVillage Model
                </Link>
                , we work across multiple sectors — including child protection,
                education, health, nutrition, economic empowerment, agriculture,
                water and sanitation, climate resilience, and community health —
                to create sustainable and lasting impact.
              </p>

              <p className="max-w-[58ch] text-base leading-relaxed text-gray lg:text-[17px]">
                Whether responding to urgent challenges or investing in
                long-term development, our goal remains the same: to create a
                world where every child grows up in a safe, healthy, and
                supportive environment.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="bg-blue py-24 lg:py-32">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-10">
            <Reveal className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
              <div className="flex items-center gap-4">
                <span className="h-0.5 w-6 bg-white-70" aria-hidden="true" />
                <span className="text-xs font-semibold tracking-[0.14em] text-white-94">
                  THE CHALLENGE
                </span>
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-[-0.03em] text-white lg:text-[42px] lg:leading-[1.08]">
                The challenge of child poverty
              </h2>
            </Reveal>

            <Reveal delay={80} className="flex flex-col gap-6 lg:col-span-7 lg:col-start-6">
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
