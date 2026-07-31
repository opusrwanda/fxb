import Image from "next/image";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui/reveal";
import { areas } from "@/lib/areas";
import { photo } from "@/lib/photos";

/**
 * Areas of Intervention — four cards, per the brief.
 *
 * Each card carries its own anchor as well as the section's, because the home
 * page's four pillars link straight to the individual areas
 * (`/what-we-do#health` and so on) rather than to the block.
 *
 * The brief's eventual shape for these is "Context, Goal, Activities, Impact",
 * with the copy "to be provided later". Rather than stub four empty headings,
 * each card shows what FXB has actually written: the focus areas listed under
 * the same four headings in the Our Impact section. See `areas.ts`.
 */
export function AreasOfIntervention() {
  return (
    <section id="areas" className="scroll-mt-32 bg-white py-24 lg:py-32">
      <Container>
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-green" aria-hidden="true" />
              <span className="text-xs font-semibold tracking-[0.22em] text-gray-40">
                AREAS OF INTERVENTION
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[44px] lg:leading-[1.1]">
              Four areas, one household
            </h2>
          </div>
          <p className="max-w-[46ch] text-base leading-relaxed text-gray lg:text-right lg:text-[17px]">
            The model is delivered through four areas of intervention. A family
            rarely needs only one of them, which is why we never run them apart.
          </p>
        </Reveal>

        <ul className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-10">
          {areas.map((area, index) => (
            <Reveal as="li" key={area.id} delay={80 + (index % 2) * 80}>
              {/* The anchor sits on the article rather than the Reveal
                  wrapper, which takes no id — and it is what the home page's
                  four pillars jump to, so it needs the header offset. */}
              <article id={area.id} className="flex h-full scroll-mt-32 flex-col">
                <div className="wedge relative aspect-16/10 overflow-hidden">
                  <Image
                    src={photo(area.photo).url}
                    alt={area.alt}
                    fill
                    sizes="(min-width: 1024px) 46vw, 90vw"
                    className="object-cover"
                  />
                </div>

                <h3 className="mt-7 text-2xl font-bold tracking-[-0.02em] text-blue lg:text-[28px]">
                  {area.label}
                </h3>
                <p className="mt-2 text-base text-gray lg:text-[17px]">
                  {area.blurb}
                </p>

                {area.focus.length > 0 && (
                  <ul className="mt-6 flex flex-col gap-3 border-t border-gray-15 pt-6">
                    {area.focus.map((item) => (
                      <li key={item} className="flex gap-3.5">
                        <span
                          className="mt-2 size-1.5 shrink-0 rounded-full bg-green"
                          aria-hidden="true"
                        />
                        <span className="text-[15px] leading-snug text-gray">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
