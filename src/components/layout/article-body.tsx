import Image from "next/image";
import type { Img } from "@/cms/content/image";
import type { RichText } from "@/cms/content/news";
import { saysNoMoreThan } from "@/cms/content/richtext";
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
 * Where the body says no more than the excerpt already did, the page prints
 * the description and stops. It used to print an apology in its place — a
 * panel headed "The full piece is being migrated", with a button offering to
 * email the text. That was true of the migration and false of the site: all
 * seven articles were in that state, so every news item and every story on
 * the site led with a notice that it was not finished.
 *
 * A short article is not a broken one. The description is what FXB has
 * written about that piece of work, so it is what the page shows, and the
 * `Prose` body appears under it the moment somebody adds a second sentence in
 * `/staff`.
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

            {/* Nothing where the panel was. An article whose body adds
                nothing to its standfirst is a short article, and it now reads
                as one — the description above is the piece. */}
            {written && (
              <Reveal delay={250} className="mt-10">
                <Prose data={body} lang={language} />
              </Reveal>
            )}
          </div>

          <Reveal delay={360} className="mt-14">
            <Pill href={backHref} variant="outline" size="lg">
              {backLabel}
            </Pill>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
