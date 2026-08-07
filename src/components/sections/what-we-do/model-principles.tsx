import { Container } from "@/components/layout/container";
import { Accordion } from "@/components/ui/accordion";
import { Reveal } from "@/components/ui/reveal";
import { principles } from "@/lib/fxbvillage";

/**
 * The three guiding principles, as titles that open in place.
 *
 * The panels are built here, on the server, and handed to the client accordion
 * as props — so the only JavaScript this section ships is the open/close, not
 * the copy.
 */
export function ModelPrinciples() {
  return (
    <section id="principles" className="scroll-mt-36 bg-blue-08 py-24 lg:py-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-10">
          <Reveal className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
            <div className="flex items-center gap-4">
              <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
              <span className="text-[24px] font-semibold tracking-[0.14em] text-gray-80">
                GUIDING PRINCIPLES
              </span>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[42px] lg:leading-[1.08]">
              Built on three principles
            </h2>
            <p className="mt-6 max-w-[40ch] text-base leading-relaxed text-gray">
              At FXB Rwanda, we believe that every family has the potential to
              overcome poverty when provided with the right opportunities,
              knowledge, and support.
            </p>
          </Reveal>

          <Reveal delay={140} className="lg:col-span-7 lg:col-start-6">
            <Accordion
              items={principles.map((principle) => ({
                id: principle.id,
                title: principle.title,
                content: (
                  <p className="max-w-[58ch] text-base leading-relaxed text-gray lg:text-[17px]">
                    {principle.body}
                  </p>
                ),
              }))}
            />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
