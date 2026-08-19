import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getArea, getAreas } from "@/cms/content/areas";
import { isEmpty } from "@/cms/content/richtext";
import { getSiteDetails } from "@/cms/content/settings";
import { ArticleOpening } from "@/components/layout/article-opening";
import { Container } from "@/components/layout/container";
import { Prose } from "@/components/layout/prose";
import { RelatedArticles } from "@/components/layout/related-articles";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";

/**
 * One area of intervention.
 *
 * The areas had no page. The card on What We Do was the whole of them — a
 * name, a dozen words and a bulleted list — and both the home page's pillars
 * and the section's own cards pointed at `/what-we-do#health`, an anchor on the
 * page the reader was already on. Following a pillar scrolled you to a card
 * that said the same sentence the pillar had just said.
 *
 * So each area gets what a programme already had: a title, an opening, its
 * photograph and an account of the work. Every one of those is absent when its
 * field is empty, and an area nobody has written up yet says so plainly rather
 * than padding itself out on FXB's behalf.
 *
 * The other areas sit beside it, in the sidebar an article uses for what to
 * read next — and for the same reason. The areas are only meaningful against
 * each other: FXB's argument is that a family never needs one of them alone,
 * so the page for any one of them should show the rest rather than end at a
 * button back to the listing. It is the same component, which is what keeps
 * the two from drifting into two sidebars that look alike and behave
 * differently.
 *
 * The rail that held the bulleted focus areas is gone, and this is not it:
 * what an area covers is a thing to explain in the writing, where it can be
 * explained, rather than five fragments in a box beside it.
 *
 * It opens the way an article opens — trail, kicker, name, its own photograph —
 * which is why the route is in `WHITE_GROUND` and the header is solid from
 * scroll 0. The hero room would have given every area the same page banner and
 * then put the area's own picture directly under it.
 */
export async function generateStaticParams() {
  const areas = await getAreas();
  return areas.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const area = await getArea(slug);
  if (!area) return {};

  return {
    title: area.label,
    description:
      area.intro ?? `${area.label} — one of FXB Rwanda's areas of intervention.`,
  };
}

export default async function AreaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [area, details] = await Promise.all([getArea(slug), getSiteDetails()]);

  // An area deleted in the panel should 404 rather than render an empty shell,
  // so a stale link fails loudly.
  if (!area) notFound();

  const written = Boolean(area.intro) || !isEmpty(area.body);

  /**
   * The other areas, in the order the panel puts them in.
   *
   * All of them, not a sample: there are four, and "other areas" that quietly
   * left one out would be a worse answer than the listing it replaces.
   */
  const others = (await getAreas())
    .filter((other) => other.slug !== area.slug)
    .map((other) => ({
      href: other.href,
      title: other.label,
      image: other.image,
    }));

  return (
    <section className="bg-white pt-[calc(4rem+3.5rem)] pb-24 lg:pt-[calc(4.5rem+5rem)] lg:pb-32">
      {/* The article's arrangement: a 52rem column with the sidebar beside
          it, the pair centred as a pair. Falling back to the column on its own
          if there is ever nothing to put next to it — a grid track reserved
          for an empty aside is 17rem of white down the right. */}
      <Container>
        <div
          className={
            others.length > 0
              ? "mx-auto grid max-w-[52rem] gap-16 lg:max-w-none lg:grid-cols-[minmax(0,52rem)_17rem] lg:justify-center lg:gap-14 xl:gap-20"
              : "mx-auto max-w-[52rem]"
          }
        >
          <div className="min-w-0">
            <ArticleOpening
              breadcrumbs={[
                { label: "What We Do", href: "/what-we-do" },
                { label: "Areas of Intervention", href: "/what-we-do#areas" },
              ]}
              eyebrow="AREA OF INTERVENTION"
              title={area.label}
              image={area.image}
            />

            <div className="mt-12 lg:mt-16">
              {written ? (
                <div className="flex flex-col gap-10">
                  {area.intro && (
                    <Reveal delay={140}>
                      <p className="max-w-[46ch] text-2xl leading-[1.4] font-medium text-blue lg:text-[28px]">
                        {area.intro}
                      </p>
                    </Reveal>
                  )}

                  {!isEmpty(area.body) && (
                    <Reveal delay={250}>
                      <Prose data={area.body} />
                    </Reveal>
                  )}
                </div>
              ) : (
                // The honest version, and the same panel Careers, Publications
                // and the programme pages use — so "being prepared" reads the
                // same way everywhere rather than as a broken page.
                <Reveal delay={140}>
                  <EmptyState
                    title="A fuller account is on its way"
                    body={`We are preparing a full description of our work on ${area.label.toLowerCase()} — what it covers, how it is delivered and what it has changed. In the meantime the team can tell you more directly.`}
                    actions={[
                      {
                        label: "Ask about this area",
                        href: `mailto:${details.email}?subject=${encodeURIComponent(area.label)}`,
                        primary: true,
                      },
                      { label: "All areas", href: "/what-we-do#areas" },
                    ]}
                  />
                </Reveal>
              )}
            </div>
          </div>

          <RelatedArticles items={others} heading="OTHER AREAS" />
        </div>
      </Container>
    </section>
  );
}
