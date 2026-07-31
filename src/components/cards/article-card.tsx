import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { photo } from "@/lib/photos";

/**
 * One item in a news or stories listing.
 *
 * Both listings show the same shape — photograph, date, headline, excerpt — so
 * they share a card rather than each growing their own copy of it.
 *
 * `language` marks an item that is not in the site's language. FXB Rwanda
 * publishes in English and French, and a French headline needs the attribute so
 * a screen reader switches voice instead of reading it as mangled English. It
 * goes on the heading and the excerpt, not the whole card, because the date
 * and the label around them are still English.
 */
export function ArticleCard({
  href,
  title,
  excerpt,
  date,
  photo: photoId,
  alt,
  language,
  delay = 0,
}: {
  href: string;
  title: string;
  excerpt: string;
  /** Already formatted for display. */
  date: string;
  photo: string;
  alt: string;
  language?: string;
  delay?: number;
}) {
  return (
    <Reveal as="li" delay={delay}>
      {/* `relative` is what the stretched link below anchors to. */}
      <article className="group relative flex h-full flex-col">
        <div className="relative aspect-16/10 overflow-hidden rounded-[20px]">
          <Image
            src={photo(photoId).url}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 31vw, (min-width: 640px) 45vw, 90vw"
            className="motion-transform object-cover transition-transform duration-[700ms] ease-out group-hover:scale-105"
          />
        </div>

        <p className="mt-6 text-sm text-gray-40">{date}</p>

        <h3
          className="mt-2 text-xl leading-snug font-semibold tracking-[-0.02em] text-blue lg:text-[22px]"
          lang={language}
        >
          {/* The whole card is one link target: the anchor stretches over the
              article so the photograph and the headline are the same click,
              without nesting two links to the same place in the tab order. */}
          <Link href={href} className="after:absolute after:inset-0">
            {title}
          </Link>
        </h3>

        <p
          className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-gray"
          lang={language}
        >
          {excerpt}
        </p>

        <span className="mt-5 flex items-center gap-2 text-sm font-semibold text-blue">
          Read more
          <ArrowUpRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </span>
      </article>
    </Reveal>
  );
}
