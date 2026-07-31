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
    <section className="bg-white py-24 lg:py-32">
      <Container>
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-24">
          <Reveal className="lg:w-80 lg:shrink-0">
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-green" aria-hidden="true" />
              <span className="text-xs font-semibold tracking-[0.22em] text-gray-40">
                GUIDING PRINCIPLES
              </span>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[40px] lg:leading-[1.1]">
              Built on three principles
            </h2>
            <p className="mt-6 max-w-[40ch] text-base leading-relaxed text-gray">
              At FXB Rwanda, we believe that every family has the potential to
              overcome poverty when provided with the right opportunities,
              knowledge, and support.
            </p>
          </Reveal>

          <Reveal delay={80} className="flex-1">
            <Accordion
              items={principles.map((principle) => ({
                id: principle.id,
                title: principle.title,
                content: (
                  <p className="max-w-[62ch] text-base leading-relaxed text-gray lg:text-[17px]">
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
