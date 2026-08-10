import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Img } from "@/cms/content/image";
import type { RichText } from "@/cms/content/news";
import { saysNoMoreThan } from "@/cms/content/richtext";
import { Container } from "@/components/layout/container";
import { Prose } from "@/components/layout/prose";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import type { Crumb } from "@/components/sections/hero";

/**
 * A single news item or story.
 *
 * Both are the same document — headline, date, lead photograph, body — so they
 * share this rather than each keeping a copy.
 *
 * WHY THIS DOES NOT USE `PageHeader`
 *
 * It used to, and that was the mistake. `PageHeader` is the hero room: a
 * full-height photograph from the page-banners global, with the title set
 * white and huge over it. It is right for Who We Are and Contact, which are
 * places on the site — a landing wants to announce itself.
 *
 * An article is not a place, it is a piece of writing, and the room did three
 * things to it. The banner is chosen per route, so every article shared one
 * generic photograph that had nothing to do with any of them — and then the
 * article's own lead photograph appeared directly beneath it, so the page
 * opened with two large pictures, one of them irrelevant. A 100-character
 * French headline set at hero size wrapped to seven lines and filled the
 * screen on its own. And the whole thing read as a section landing, so a
 * reader arriving from the listing could not tell they had reached the piece.
 *
 * So the article opens the way articles open: trail, kicker, headline and date
 * on white, then its own photograph, then the writing. No banner, because the
 * article already has a picture and it is the right one.
 *
 * The header pins from scroll 0 here, which is what makes a white opening
 * safe: it is `HeroSentinels` that licenses the transparent bar, this page
 * renders none, and `hero-sentinels.tsx` documents that a page without them
 * keeps the solid bar — Contact and Careers already rely on it.
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
    <article
      // Top padding clears the pinned bar — 64px on a phone, 72px from `lg` —
      // and then opens the page. Nothing sits behind the header here, so this
      // is clearance rather than the hero's overlap.
      className="bg-white pt-[calc(4rem+3.5rem)] pb-24 lg:pt-[calc(4.5rem+5rem)] lg:pb-32"
    >
      <Container>
        {/* One column for the whole article, picture included.

            The lead photograph used to run the full 1200 of the container
            while the headline sat at 814 and the standfirst at 826 — a 370px
            overhang on one side of a left-aligned page, which does not read
            as a deliberately wide picture so much as a picture that missed
            the column. A full-bleed lead is a real editorial move, but it
            wants to be full bleed, not full container.

            52rem is chosen from the type rather than picked: it is a little
            over the 24ch headline and the 46ch standfirst at their largest
            sizes, so the three left edges line up and no line of text has to
            change measure to fit the column. `Prose` stays narrower inside
            it, which is what a reading measure is for. */}
        <div className="max-w-[52rem]">
          <Reveal className="flex flex-col gap-6">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-80">
                {breadcrumbs.map((crumb, index) => (
                  <li key={crumb.href} className="flex items-center gap-1.5">
                    <Link
                      href={crumb.href}
                      className="transition-colors duration-300 hover:text-blue"
                    >
                      {crumb.label}
                    </Link>
                    {/* Between crumbs only — the article itself is the `h1`
                      below, so a trailing chevron would point at nothing. */}
                    {index < breadcrumbs.length - 1 && (
                      <ChevronRight className="size-3.5" aria-hidden="true" />
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            <div className="flex items-center gap-4">
              <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
              <span className="text-xs font-semibold tracking-[0.18em] text-gray-80">
                {eyebrow}
              </span>
            </div>

            {/* Held to 24ch and set well below hero size. The constraint here is
              a headline that has to stay readable at any length: the French
              Open Days piece runs 104 characters, and at the hero's 88px it
              was seven lines of display type before the reader reached a
              single word of the article.

              `lang` travels with it. A French headline read by an English
              screen reader is mangled twice over — once in the voice and once
              in the pronunciation of every accented vowel. */}
            <h1
              lang={language}
              className="max-w-[24ch] text-3xl leading-[1.12] font-bold tracking-[-0.03em] text-balance text-blue sm:text-[38px] lg:text-[52px]"
            >
              {title}
            </h1>

            <p className="text-sm text-gray-80">
              <time>{date}</time>
            </p>
          </Reveal>

          {/* The rule is the join. It closes the header block and opens the
            article under it, which is the job the hero's bottom edge used to
            do by simply running out of photograph. */}
          <div className="mt-10 h-px w-full bg-gray-15" aria-hidden="true" />

          {image && (
            <Reveal delay={110} className="mt-10">
              <div className="relative aspect-16/9 overflow-hidden rounded-card">
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  priority
                  // 832 to match the column above, not the 1200 of the
                  // container it used to fill.
                  sizes="(min-width: 1024px) 832px, 92vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          )}

          <div className="mt-12 lg:mt-16">
            <Reveal delay={140}>
              <p
                className="max-w-[46ch] text-2xl leading-[1.4] font-medium text-blue lg:text-[28px]"
                lang={language}
              >
                {excerpt}
              </p>
            </Reveal>

            {/* Nothing where the migration panel was. An article whose body adds
              nothing to its standfirst is a short article, and it now reads as
              one — the description above is the piece. */}
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
        </div>
      </Container>
    </article>
  );
}
