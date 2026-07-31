import Image from "next/image";
import { Container } from "@/components/layout/container";
import { Accordion } from "@/components/ui/accordion";
import { Reveal } from "@/components/ui/reveal";
import { pillars } from "@/lib/fxbvillage";
import { photo } from "@/lib/photos";

/**
 * The pillars of the FXBVillage model.
 *
 * Same pattern as the principles — titles that open in place — with the single
 * photograph the brief asks for beside the whole block rather than one per
 * pillar. It is sticky on desktop so it stays with the list however far down
 * the reader opens.
 *
 * A blue room, so the page keeps alternating: the principles above it and the
 * SDGs below are both on white, and three white rooms in a row would run the
 * middle of this page together.
 *
 * NOTE ON THE COUNT: the brief introduces "six mutually reinforcing pillars"
 * and then supplies five. The copy here counts what is actually on the page,
 * and a sixth can be dropped into `fxbvillage.ts` without touching this file —
 * but the discrepancy is FXB's to resolve.
 */
export function ModelPillars() {
  const image = photo("sugira-muryango-01");

  return (
    <section className="bg-blue py-24 lg:py-32">
      <Container>
        <Reveal className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-white-40" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-[0.22em] text-white-70">
              THE PILLARS
            </span>
          </div>
          <h2 className="max-w-[24ch] text-3xl font-bold tracking-[-0.03em] text-white lg:text-[44px] lg:leading-[1.1]">
            Five pillars, delivered together
          </h2>
          <p className="max-w-[62ch] text-base leading-relaxed text-white-70 lg:text-[17px]">
            The model integrates a set of mutually reinforcing pillars that work
            together to improve the overall well-being of families.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <Reveal>
            <Accordion
              variant="dark"
              items={pillars.map((pillar) => ({
                id: pillar.id,
                title: pillar.title,
                content: (
                  <div className="flex flex-col gap-7">
                    {pillar.lead && (
                      <p className="max-w-[62ch] text-base leading-relaxed text-white-70 lg:text-[17px]">
                        {pillar.lead}
                      </p>
                    )}

                    <div>
                      <h4 className="text-xs font-semibold tracking-[0.22em] text-white-40">
                        KEY INTERVENTIONS
                      </h4>
                      <dl className="mt-5 flex flex-col gap-5">
                        {pillar.interventions.map((intervention) => (
                          <div
                            key={intervention.name}
                            className="border-l-2 border-white-12 pl-5"
                          >
                            <dt className="text-base font-semibold text-white">
                              {intervention.name}
                            </dt>
                            <dd className="mt-1.5 max-w-[58ch] text-[15px] leading-relaxed text-white-70">
                              {intervention.body}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                ),
              }))}
            />
          </Reveal>

          <Reveal delay={120} className="order-first lg:order-none">
            <div className="wedge relative aspect-4/5 overflow-hidden lg:sticky lg:top-28">
              <Image
                src={image.url}
                alt="A community facilitator holding the Sugira Muryango coaching flipchart used on home visits"
                fill
                sizes="(min-width: 1024px) 38vw, 90vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
