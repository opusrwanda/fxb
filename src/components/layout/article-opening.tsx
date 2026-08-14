import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { Img } from "@/cms/content/image";
import { Reveal } from "@/components/ui/reveal";
import type { Crumb } from "@/components/sections/hero";

/**
 * How a document opens: trail, kicker, headline, a line of facts, its own
 * photograph.
 *
 * WHY THIS IS NOT `PageHeader`. `PageHeader` is the hero room — a full-height
 * photograph from the page-banners global with the title set white and huge
 * over it. It is right for Who We Are and Contact, which are places on the
 * site; a landing wants to announce itself.
 *
 * A document is not a place. It is a piece of writing about one thing, and the
 * room does three things to it. The banner is chosen per route, so every
 * document under one route shares a photograph that has nothing to do with any
 * of them — and then the document's own picture appears directly beneath it,
 * so the page opens with two large images, one irrelevant. A long title set at
 * hero size fills the screen on its own. And the whole thing reads as a
 * section landing, so a reader arriving from a listing cannot tell they have
 * arrived.
 *
 * The news and story pages worked this out first. Programme pages had the same
 * problem and the same answer, so the opening is shared rather than described
 * twice and allowed to drift.
 *
 * A ROUTE USING THIS MUST BE IN `WHITE_GROUND`. It opens on white, so the
 * header has to be solid from scroll 0 — see `lib/site.ts`, where getting it
 * wrong is a white lockup on a white page.
 */
export function ArticleOpening({
  breadcrumbs,
  eyebrow,
  title,
  meta,
  language,
  image,
  priority = true,
  sizes = "(min-width: 1024px) 832px, 92vw",
}: {
  breadcrumbs: Crumb[];
  eyebrow: string;
  title: string;
  /** The line under the headline — a date, the districts, whatever fits. */
  meta?: React.ReactNode;
  /** BCP 47 tag, where the title is not in the site's language. */
  language?: string;
  image: Img | null;
  priority?: boolean;
  /**
   * The slot the lead photograph fills, for picking a file.
   *
   * The default is the article column. A programme page runs its opening
   * across the full container, and leaving the article's hint there would ask
   * the browser for an 832px file to fill 1200 — the photograph arrives
   * visibly soft, which is the same mistake the publications grid made and is
   * invisible until somebody looks at a wide screen.
   */
  sizes?: string;
}) {
  return (
    <>
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
                {/* Between crumbs only — the document itself is the `h1`
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

        {/* Held to 24ch and set well below hero size. The constraint is a
            headline that stays readable at any length: the French Open Days
            piece runs 104 characters, and at the hero's 88px it was seven
            lines of display type before a single word of the article.

            `lang` travels with it. A French headline read by an English screen
            reader is mangled twice over — once in the voice and once in the
            pronunciation of every accented vowel. */}
        <h1
          lang={language}
          className="max-w-[24ch] text-3xl leading-[1.12] font-bold tracking-[-0.03em] text-balance text-blue sm:text-[38px] lg:text-[52px]"
        >
          {title}
        </h1>

        {meta && <div className="text-sm text-gray-80">{meta}</div>}
      </Reveal>

      {/* The rule is the join. It closes the opening and starts the document
          under it, which is the job the hero's bottom edge used to do by
          simply running out of photograph. */}
      <div className="mt-10 h-px w-full bg-gray-15" aria-hidden="true" />

      {image && (
        <Reveal delay={110} className="mt-10">
          <div className="relative aspect-16/9 overflow-hidden rounded-card">
            <Image
              src={image.url}
              alt={image.alt}
              fill
              priority={priority}
              sizes={sizes}
              className="object-cover"
            />
          </div>
        </Reveal>
      )}
    </>
  );
}
