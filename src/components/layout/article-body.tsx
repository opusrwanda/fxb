import Image from "next/image";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { photo } from "@/lib/photos";
import { org } from "@/lib/site";
import type { Crumb } from "@/components/layout/page-header";

/**
 * A single news item or story.
 *
 * Both are the same document — headline, date, lead photograph, body — so they
 * share this rather than each keeping a copy.
 *
 * The full bodies have not been migrated from the current site yet. Where one
 * is missing the page renders the excerpt as a standfirst and says plainly that
 * the rest is coming, instead of padding it out or pretending the excerpt is
 * the article. That is a temporary state with an obvious fix: fill `body` in
 * `news.ts` or `stories.ts`.
 */
export function ArticleBody({
  eyebrow,
  breadcrumbs,
  title,
  date,
  excerpt,
  body,
  photo: photoId,
  alt,
  language,
  backHref,
  backLabel,
}: {
  eyebrow: string;
  breadcrumbs: Crumb[];
  title: string;
  /** Already formatted for display. */
  date: string;
  excerpt: string;
  body?: string[];
  photo: string;
  alt: string;
  language?: string;
  backHref: string;
  backLabel: string;
}) {
  const image = photo(photoId);

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} eyebrow={eyebrow} title={title} />

      <section className="bg-white pb-24 lg:pb-32">
        <Container>
          <Reveal>
            <p className="text-sm text-gray-40">{date}</p>
          </Reveal>

          <Reveal delay={60} className="mt-8">
            <div className="relative aspect-16/9 overflow-hidden rounded-[24px]">
              <Image
                src={image.url}
                alt={alt}
                fill
                priority
                sizes="(min-width: 1280px) 1200px, 92vw"
                className="object-cover"
              />
            </div>
          </Reveal>

          <div className="mt-14 lg:mt-20">
            <Reveal delay={80}>
              <p
                className="max-w-[46ch] text-2xl leading-[1.4] font-medium text-blue lg:text-[30px]"
                lang={language}
              >
                {excerpt}
              </p>
            </Reveal>

            {body && body.length > 0 ? (
              <Reveal delay={140} className="mt-10 flex flex-col gap-6">
                {body.map((paragraph, index) => (
                  <p
                    key={index}
                    className="max-w-[70ch] text-base leading-relaxed text-gray lg:text-[17px]"
                    lang={language}
                  >
                    {paragraph}
                  </p>
                ))}
              </Reveal>
            ) : (
              <Reveal
                delay={140}
                className="wedge mt-12 flex flex-col items-start gap-5 bg-blue-08 p-8 lg:p-10"
              >
                <h2 className="text-xl font-bold tracking-[-0.02em] text-blue">
                  The full piece is being migrated
                </h2>
                <p className="max-w-[62ch] text-base leading-relaxed text-gray">
                  We are moving our archive across from the old site. This
                  article&rsquo;s full text will appear here shortly — in the
                  meantime, the team is glad to send it to you.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Pill href={backHref} variant="primary">
                    {backLabel}
                  </Pill>
                  <Pill href={`mailto:${org.email}`}>Request the full text</Pill>
                </div>
              </Reveal>
            )}
          </div>

          {body && body.length > 0 && (
            <Reveal delay={200} className="mt-14">
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
