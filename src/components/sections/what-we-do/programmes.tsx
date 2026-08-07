import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { getCurrentProgrammes } from "@/cms/content/programmes";

/**
 * The programmes running today.
 *
 * These existed only on `/what-we-do/current-projects`, behind a button near the
 * bottom of a ten-thousand-pixel page. So the one page on the site called What
 * We Do never actually named five of the six things FXB Rwanda does — a visitor
 * had to know the sub-page was there and go looking for it. That is the same
 * problem the hero copy had, one level down: the model was standing in for the
 * whole organisation.
 *
 * Every programme is named here, with the districts it reaches, from the
 * Programmes collection — the same source as the map on Who We Are and the
 * sub-page, so phasing one out in `/staff` updates all three and cannot leave
 * one of them stale.
 *
 * The sub-page stays. It is the same six programmes, but it is where the
 * per-programme detail lands when FXB supplies it — the fields are already on
 * the collection waiting — and a listing that grows a paragraph, a funder and a
 * period each does not belong inside a section on another page.
 *
 * Counts are derived here rather than written down, for the reason the hero
 * gives: a hand-typed "six programmes" is wrong the first time one ends.
 */
export async function Programmes() {
  const programmes = await getCurrentProgrammes();
  const districtCount = new Set(
    programmes.flatMap((programme) => programme.districts),
  ).size;

  return (
    <section id="programmes" className="scroll-mt-36 bg-white py-24 lg:py-32">
      <Container>
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
              <span className="text-[24px] font-semibold tracking-[0.14em] text-gray-80">
                OUR PROGRAMMES
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[42px] lg:leading-[1.08]">
              What we are running today
            </h2>
          </div>
          <p className="max-w-[46ch] text-base leading-relaxed text-gray lg:text-[17px]">
            {programmes.length} programmes across {districtCount} districts,
            delivered with government, donors and community partners. The
            FXBVillage model runs alongside all of them.
          </p>
        </Reveal>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {programmes.map((project, index) => (
            <Reveal
              as="li"
              key={project.slug}
              delay={60 + Math.min(index, 3) * 60}
            >
              {/* The whole card is the link now. It used to be the name only,
                    and only on the two programmes that happened to have an
                    `href` — so four of the six cards were not clickable at all
                    and the other two led somewhere that was not about the
                    programme. */}
              <Link
                href={`/what-we-do/programmes/${project.slug}`}
                className="wedge group flex h-full flex-col overflow-hidden border border-gray-15 transition-colors duration-500 hover:border-blue"
              >
                {project.image && (
                  <div className="relative aspect-16/10 overflow-hidden bg-blue-08">
                    <Image
                      src={project.image.url}
                      alt={project.image.alt}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                      className="motion-transform object-cover transition-transform duration-700 ease-(--ease-standard) group-hover:scale-[1.04]"
                    />
                  </div>
                )}

                <div className="flex flex-1 flex-col gap-4 p-6 lg:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-2xl leading-snug font-semibold tracking-[-0.02em] text-blue">
                      {project.name}
                    </h3>

                    <span className="wedge-nudge motion-transform mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-08 transition-colors duration-500 group-hover:bg-blue">
                      <ArrowUpRight
                        className="size-4 text-blue transition-colors duration-500 group-hover:text-white"
                        aria-hidden="true"
                      />
                    </span>
                  </div>

                  {/* Middots rather than commas, so the districts read as a
                        set rather than as a sentence — the same treatment they
                        get on the Who We Are map. */}
                  <p className="mt-auto text-[15px] leading-snug text-gray">
                    <span className="font-semibold text-gray-80">
                      {project.districts.length}{" "}
                      {project.districts.length === 1
                        ? "district"
                        : "districts"}
                    </span>
                    <span aria-hidden="true"> · </span>
                    {project.districts.join(" · ")}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={540} className="mt-12 flex flex-wrap gap-4">
          <Pill href="/what-we-do/current-projects" variant="outline" size="lg">
            Programme details
          </Pill>
          <Pill href="/who-we-are#where-we-work" size="lg">
            See where we work
          </Pill>
        </Reveal>
      </Container>
    </section>
  );
}
