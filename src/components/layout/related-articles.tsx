import Image from "next/image";
import Link from "next/link";

import type { Img } from "@/cms/content/image";
import { Reveal } from "@/components/ui/reveal";

/**
 * What to read next, beside the article.
 *
 * An article used to end at a single "All news" button, which asks somebody
 * who has just finished reading to go back to a listing and start choosing
 * again. The four most recent pieces sitting next to the one they are reading
 * answer the same question without the round trip.
 *
 * STICKY, AND ONLY ON A WIDE SCREEN. It holds its place while the article
 * scrolls past — which is the point, because the moment a reader is most
 * likely to want another piece is the moment they reach the end of this one,
 * and a sidebar that scrolled away is gone by then. On a phone there is no
 * beside; it stacks under the article, where it reads as the "more from us"
 * block it becomes.
 *
 * Four, and four is a judgement rather than a limit. Enough to look like a
 * choice, few enough that the column ends before the article does on anything
 * but the shortest piece — a sidebar taller than its article is a second
 * article competing with the first.
 */

export type RelatedItem = {
  href: string;
  title: string;
  /** Already formatted for display. */
  date: string;
  image: Img | null;
  language?: string;
};

export function RelatedArticles({
  items,
  heading,
}: {
  items: RelatedItem[];
  heading: string;
}) {
  if (items.length === 0) return null;

  return (
    // A real `aside`, rather than `Reveal as="aside"`. `Reveal` takes four
    // props and passes none of them on, so the `aria-labelledby` naming this
    // landmark was silently dropped — the element was there and, to a screen
    // reader, unnamed. The animation goes inside instead, where losing a prop
    // costs nothing.
    <aside
      aria-labelledby="related-heading"
      // `self-start` is what makes the sticky work. A grid item stretches to
      // the row height by default, so the box would already be as tall as the
      // article and have nowhere to stick to.
      className="lg:sticky lg:top-28 lg:self-start"
    >
      <Reveal delay={200}>
        <h2
          id="related-heading"
          className="text-xs font-semibold tracking-[0.18em] text-gray-80"
        >
          {heading}
        </h2>

        <ul className="mt-6 flex flex-col">
          {items.map((item) => (
            <li
              key={item.href}
              className="border-t border-gray-15 last:border-b"
            >
              {/* The whole row is the link — photograph, headline and date —
                rather than a link on the headline with two dead elements
                beside it. A reader aiming at the picture is aiming at the
                article. */}
              <Link
                href={item.href}
                className="group flex items-start gap-4 py-4 transition-colors duration-300"
              >
                {item.image ? (
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-[10px] bg-blue-08">
                    <Image
                      src={item.image.url}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover transition-transform duration-500 ease-(--ease-standard) group-hover:scale-105"
                    />
                  </span>
                ) : (
                  // A placeholder rather than a collapsed row, so the headlines
                  // keep one left edge whether or not every piece has a picture.
                  <span
                    className="size-16 shrink-0 rounded-[10px] bg-blue-08"
                    aria-hidden="true"
                  />
                )}

                <span className="min-w-0">
                  <span
                    lang={item.language}
                    className="block text-[15px] leading-snug font-semibold text-blue transition-colors duration-300 group-hover:text-green"
                  >
                    {item.title}
                  </span>
                  <span className="mt-1 block text-[13px] text-gray-80">
                    {item.date}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </aside>
  );
}
