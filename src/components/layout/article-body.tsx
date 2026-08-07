import Image from "next/image";
import type { Img } from "@/cms/content/image";
import type { RichText } from "@/cms/content/news";
import { saysNoMoreThan } from "@/cms/content/richtext";
import type { SiteDetails } from "@/cms/content/settings";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Prose } from "@/components/layout/prose";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import type { Crumb } from "@/components/layout/page-header";

/**
 * A single news item or story.
 *
 * Both are the same document — headline, date, lead photograph, body — so they
 * share this rather than each keeping a copy.
 *
 * Where the body says no more than the excerpt already did, the page renders
 * the excerpt as a standfirst and says plainly that the rest is coming, instead
 * of printing the same sentence twice. The migration seeded each article's
 * excerpt as its opening paragraph so the team would have something to open
 * rather than an empty editor; this is the state that leaves, and it clears
 * itself the moment somebody writes a second sentence in `/staff`.
 */
export function ArticleBody({
  eyebrow,
  breadcrumbs,
  title,
  date,
  excerpt,
  body,
  image,
  language,
  backHref,
  backLabel,
  details,
}: {
  eyebrow: string;
  breadcrumbs: Crumb[];
  title: string;
  /** Already formatted for display. */
  date: string;
  excerpt: string;
  body: RichText | null;
  image: Img | null;
  language?: string;
  backHref: string;
  backLabel: string;
  details: SiteDetails;
}) {
  const written = !saysNoMoreThan(body, excerpt);

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} eyebrow={eyebrow} title={title} />

      <section className="bg-white pb-24 lg:pb-32">
        <Container>
          <Reveal>
            <p className="text-sm text-gray-80">{date}</p>
          </Reveal>

          {image && (
            <Reveal delay={110} className="mt-8">
              <div className="relative aspect-16/9 overflow-hidden rounded-card">
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  priority
                  sizes="(min-width: 1280px) 1200px, 92vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          )}

          <div className="mt-14 lg:mt-20">
            <Reveal delay={140}>
              <p
                className="max-w-[46ch] text-2xl leading-[1.4] font-medium text-blue lg:text-[28px]"
                lang={language}
              >
                {excerpt}
              </p>
            </Reveal>

            {written ? (
              <Reveal delay={250} className="mt-10">
                <Prose data={body} lang={language} />
              </Reveal>
            ) : (
              <Reveal
                delay={250}
                className="wedge mt-12 flex flex-col items-start gap-5 bg-blue-08 p-8 lg:p-10"
              >
                <h2 className="text-xl font-bold tracking-[-0.02em] text-blue">
                  The full piece is being migrated
                </h2>
                <p className="max-w-[58ch] text-base leading-relaxed text-gray">
                  We are moving our archive across from the old site. This
                  article&rsquo;s full text will appear here shortly — in the
                  meantime, the team is glad to send it to you.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Pill href={backHref} variant="primary">
                    {backLabel}
                  </Pill>
                  <Pill href={`mailto:${details.email}`}>
                    Request the full text
                  </Pill>
                </div>
              </Reveal>
            )}
          </div>

          {written && (
            <Reveal delay={360} className="mt-14">
              <Pill href={backHref} variant="outline" size="lg">
                {backLabel}
              </Pill>
            </Reveal>
          )}
        </Container>
      </section>
    </>
  );
}
