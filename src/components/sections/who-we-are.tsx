import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui/reveal";

/**
 * Who We Are — the quiet room.
 *
 * It follows the hero deliberately underweight: white ground, one statement,
 * one link. A loud room is always followed by a quiet one, and this is the
 * pause that makes the blue room below it land.
 *
 * The copy is condensed from Our Story in the content brief — the 1995 arrival,
 * the 2000 model, the 2012 registration, and where the work stands today. The
 * full timeline belongs on the Who We Are page, not here.
 */

/** Counts drawn from the content brief and the Brand Guiding Tool. */
const figures = [
  ["1995", "Working in Rwanda since"],
  ["4", "Provinces, plus Kigali"],
  ["54", "FXBVillage projects delivered"],
  ["6", "Projects running today"],
];

export function WhoWeAre() {
  return (
    <section id="who-we-are" className="bg-white py-24 lg:py-32">
      <Container>
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-24">
          <Reveal className="lg:w-72 lg:shrink-0">
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-green" aria-hidden="true" />
              <span className="text-xs font-semibold tracking-[0.22em] text-gray-40">
                WHO WE ARE
              </span>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[40px] lg:leading-[1.1]">
              Rooted here since 1995
            </h2>
          </Reveal>

          <Reveal delay={80} className="flex flex-1 flex-col items-start gap-9">
            <p className="max-w-[38ch] text-2xl leading-[1.4] font-medium text-blue lg:text-[32px]">
              A Rwandan NGO that began in the aftermath of the 1994 Genocide
              against the Tutsi, and never left.
            </p>

            <p className="max-w-[62ch] text-base leading-relaxed text-gray lg:text-[17px]">
              FXB International came to Rwanda in 1995 to walk with vulnerable
              children, widows and families on the road back to self-reliance.
              The FXBVillage model followed in 2000, and in 2012 we became a
              registered Rwandan NGO in our own right. Today we work across all
              four provinces and the City of Kigali — a local organisation
              carrying a global name, and the legacy of François-Xavier
              Bagnoud, into its fourth decade.
            </p>

            <div className="h-px w-full bg-gray-15" aria-hidden="true" />

            <dl className="grid w-full grid-cols-2 gap-8 sm:grid-cols-4">
              {figures.map(([figure, label]) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <dt className="text-3xl font-bold tracking-[-0.04em] text-blue lg:text-4xl">
                    {figure}
                  </dt>
                  <dd className="text-sm leading-snug text-gray">{label}</dd>
                </div>
              ))}
            </dl>

            <Link
              href="/who-we-are"
              className="group flex items-center gap-3 text-lg font-semibold text-blue"
            >
              Read our story
              <span className="flex size-9 items-center justify-center rounded-full border border-gray-15 transition-colors duration-300 group-hover:border-blue group-hover:bg-blue">
                <ArrowRight
                  className="size-4 transition-colors duration-300 group-hover:text-white"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
