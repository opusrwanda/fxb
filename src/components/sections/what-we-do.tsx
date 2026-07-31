import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui/reveal";
import { areas } from "@/lib/areas";
import { photo } from "@/lib/photos";

/**
 * What We Do — the blue room.
 *
 * Four photographic cards, one per area of intervention, each linking to its
 * own section on the What We Do page. Photographs rather than text labels: the
 * brief is explicit that these are visual pillars.
 *
 * The card carries the wedge — bottom-right corner squared off, after the X in
 * the FXB mark. On hover the photograph pushes in behind a fixed frame while
 * the scrim deepens, so the type never loses contrast mid-animation.
 *
 * Photography is the supplied FXB library, served from the Bunny pull zone.
 *
 * The four areas live in `areas.ts` because the Areas of Intervention section
 * on What We Do names and illustrates the same four; holding them in one place
 * is what stops the two pages drifting apart.
 *
 * NOTE: Herbal Medicine has no dedicated photograph in the supplied set — the
 * seedling nursery stands in for it, and it remains the one area with no
 * written content anywhere in the brief either.
 */

export function WhatWeDo() {
  return (
    <section id="what-we-do" className="bg-blue py-24 lg:py-32">
      <Container>
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-white-40" aria-hidden="true" />
              <span className="text-xs font-semibold tracking-[0.22em] text-white-70">
                WHAT WE DO
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-white lg:text-[44px] lg:leading-[1.1]">
              Four areas of intervention
            </h2>
          </div>
          <p className="max-w-[46ch] text-base leading-relaxed text-white-70 lg:text-right lg:text-lg">
            Delivered together through the FXBVillage model, because families
            never face one problem at a time.
          </p>
        </Reveal>

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {areas.map((area, index) => (
            <Reveal as="li" key={area.href} delay={120 + index * 80}>
              <Link
                href={area.href}
                className="wedge group relative flex aspect-4/5 flex-col justify-end overflow-hidden"
              >
                <Image
                  src={photo(area.photo).url}
                  alt={area.alt}
                  fill
                  sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 90vw"
                  className="motion-transform object-cover object-[50%_38%] transition-transform duration-[700ms] ease-out group-hover:scale-105"
                />

                {/* Deepens on hover so the label never loses contrast while the
                    photograph moves underneath it. */}
                <span
                  className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-black/5 transition-opacity duration-[700ms] ease-out group-hover:opacity-90"
                  aria-hidden="true"
                />

                <span className="relative flex flex-col gap-3 p-7">
                  <span className="flex items-start justify-between gap-4">
                    <span className="text-xl leading-[1.2] font-semibold tracking-[-0.02em] text-white lg:text-[22px]">
                      {area.label}
                    </span>
                    <span className="motion-transform mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-white-12 transition-all duration-300 ease-out group-hover:bg-green">
                      <ArrowUpRight
                        className="size-4 text-white"
                        aria-hidden="true"
                      />
                    </span>
                  </span>

                  {/* Held at zero height until hover, so the resting card is
                      just photograph and title. */}
                  <span className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-[400ms] ease-out group-hover:grid-rows-[1fr]">
                    <span className="overflow-hidden">
                      <span className="block pt-1 text-sm leading-snug text-white-70">
                        {area.blurb}
                      </span>
                    </span>
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
