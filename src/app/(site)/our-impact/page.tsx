import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { SectionNav } from "@/components/layout/section-nav";
import { getStories } from "@/cms/content/stories";
import { Hero } from "@/components/sections/hero";
import { ImpactStories } from "@/components/sections/impact-stories";
import { Reach } from "@/components/sections/our-impact/reach";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Our Impact",
  description:
    "Nearly 3 million children and vulnerable individuals reached since 2012, across education, health, nutrition, economic empowerment, child protection and climate resilience.",
};

/**
 * Our Impact.
 *
 * `#results` is the anchor the header menu links to. Success Stories,
 * Publications and the Media Gallery are separate routes in the menu, so this
 * page carries the reach figures, the accountability statement behind them, and
 * the routes onward — it does not try to be all four.
 *
 * The impact stories carousel is reused from the home page rather than rebuilt:
 * it is the same three stories, and this is where the brief expects the full
 * carousel to live.
 */
export default async function OurImpactPage() {
  const stories = await getStories();

  return (
    <>
      <Hero
        headline="Creating lasting change through resilient communities."
        body="For more than three decades, FXB Rwanda has worked alongside vulnerable children, families and communities to address the root causes of poverty and vulnerability."
        ctas={[
          { label: "Results at a Glance", href: "#results", primary: true },
          { label: "Success Stories", href: "/news-insights/stories" },
        ]}
      />

      {/* Four entries for a five-thousand-pixel page. "Explore" is the last
          band rather than a section of argument, but it is where the reports,
          the annual reports and the gallery are reached from, so it earns a
          line — that band is the answer to "where is the actual evidence". */}
      <SectionNav
        sections={[
          { id: "measuring", label: "How We Measure" },
          { id: "results", label: "Results at a Glance" },
          { id: "impact-stories", label: "Success Stories" },
          { id: "explore", label: "Reports & Gallery" },
        ]}
      />

      <section id="measuring" className="scroll-mt-36 bg-white py-24 lg:py-32">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-10">
            <Reveal className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
              <div className="flex items-center gap-4">
                <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
                <span className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                  MEASURING OUR IMPACT
                </span>
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[42px] lg:leading-[1.08]">
                Counted, not claimed
              </h2>
            </Reveal>

            <Reveal delay={80} className="flex flex-col gap-6 lg:col-span-7 lg:col-start-6">
              <p className="max-w-[38ch] text-2xl leading-[1.4] font-medium text-blue lg:text-[28px]">
                Our impact is measured not only by the number of people reached,
                but by the lives transformed, families strengthened, and
                communities empowered to create a better future for children.
              </p>

              <p className="max-w-[58ch] text-base leading-relaxed text-gray lg:text-[17px]">
                Through integrated programmes in child protection, education,
                health, nutrition, economic empowerment, agriculture, WASH, and
                climate resilience, we support communities to build the
                knowledge, skills, and resources needed to become stronger and
                more self-reliant.
              </p>

              <p className="max-w-[58ch] text-base leading-relaxed text-gray lg:text-[17px]">
                At FXB Rwanda, we believe that transparency and accountability
                are essential to creating sustainable change. We continuously
                monitor and evaluate our programmes to understand what works,
                improve our interventions, and ensure resources create
                meaningful impact.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      <Reach />
      <ImpactStories stories={stories} />

      {/* Tinted, not solid blue. The stories carousel above is blue and the
          footer below is blue, so a third blue band in between made an
          unbroken ~900px slab in which this call to action read as part of
          the footer rather than as the end of the page. */}
      <section id="explore" className="scroll-mt-36 bg-blue-08 py-16 lg:py-20">
        <Container>
          <Reveal className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
            <h2 className="max-w-[24ch] text-2xl font-bold tracking-[-0.02em] text-blue lg:text-[32px] lg:leading-[1.2]">
              The full record: reports, evaluations and the photographs behind
              the figures.
            </h2>
            <div className="flex flex-wrap gap-4">
              <Pill
                href="/news-insights/publications"
                variant="primary"
                size="lg"
              >
                Publications
              </Pill>
              {/* The brief files four things under Our Impact — success
                  stories, publications, annual reports and the media gallery.
                  Three of them were reachable from this page and the annual
                  reports were not, even though they are the single document a
                  donor or institutional partner comes to an impact page
                  looking for. They live on the publications page under their
                  own anchor. */}
              <Pill href="/news-insights/publications#annual-reports" size="lg">
                Annual Reports
              </Pill>
              <Pill href="/our-impact/media-gallery" size="lg">
                Media Gallery
              </Pill>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
