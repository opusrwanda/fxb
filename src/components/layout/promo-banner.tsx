"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { PromoBanner as Banner } from "@/cms/content/banner";

/**
 * A campaign strip across the very top of the home page.
 *
 * For Kwibuka, for a fundraising appeal — the weeks when the site should lead
 * with something that is not the hero. A picture and a link and nothing else:
 * FXB's campaigns arrive as artwork already made for the poster and the
 * Instagram post, and a banner offering a text field would be a second version
 * of a message that already exists.
 *
 * ABOVE THE HEADER, NOT UNDER IT. The header is `fixed top-0` and sits
 * transparently over the hero, so a strip placed inside the page would render
 * underneath it. This is pinned above it instead and the header is pushed down
 * by exactly its height — the ordinary promotional-bar arrangement, and the
 * only one that leaves the header's relationship with the hero untouched.
 *
 * THE HEIGHT IS DECLARED ONCE, below, because three places have to agree about
 * it: the strip, the spacer that pushes the document down, and the header's
 * own offset. Three copies of `h-24` would be three chances for the header to
 * overlap the banner by four pixels on one breakpoint.
 *
 * Three sizes rather than one, because how tall a banner should be is a
 * judgement about the artwork and not a fact about the site — a wordmark and a
 * date read fine in a thin band, and a strip carrying a photograph and a
 * headline needs the room. The first version was a single fixed 56px band,
 * which turned out to be too short for the artwork FXB actually has.
 */

export type PromoHeight = "short" | "medium" | "tall";

/**
 * Each row is a pair, and the pair is the point: a height and the offset that
 * matches it, written next to each other so they cannot be changed apart.
 * Every value grows across the breakpoints, because a band that reads well on
 * a laptop is half the screen on a phone.
 */
const HEIGHTS: Record<PromoHeight, { strip: string; offset: string }> = {
  // A wordmark, a date, a line of type.
  short: { strip: "h-12 sm:h-14 lg:h-16", offset: "top-12 sm:top-14 lg:top-16" },
  // The default: enough for artwork with a headline in it.
  medium: { strip: "h-16 sm:h-20 lg:h-24", offset: "top-16 sm:top-20 lg:top-24" },
  // A designed strip with a photograph. Deliberately the largest on offer —
  // past this it stops being a banner and starts being the page.
  tall: { strip: "h-24 sm:h-32 lg:h-40", offset: "top-24 sm:top-32 lg:top-40" },
};

/** Unknown or unset falls back to the middle size, never to no height at all. */
export const promoHeight = (height: PromoHeight | undefined | null) =>
  HEIGHTS[height ?? "medium"] ?? HEIGHTS.medium;

/**
 * Where the strip is allowed to appear.
 *
 * The home page, as FXB asked. Kept as a function rather than an inline
 * comparison because `SiteHeader` has to make the identical decision — it
 * cannot offset itself for a banner that is not there, and the two answering
 * differently is a header floating 56px below the top of the window.
 */
export const showsPromo = (pathname: string | null): boolean => pathname === "/";

export function PromoBanner({ banner }: { banner: Banner | null }) {
  const pathname = usePathname();
  if (!banner || !showsPromo(pathname)) return null;

  const size = promoHeight(banner.height);

  const strip = (
    <Image
      src={banner.image.url}
      // The description given to the picture in the media library. A campaign
      // strip is not decoration — it is the only place the site is saying what
      // is happening this week — so it has to be readable without the picture.
      alt={banner.image.alt}
      fill
      priority
      sizes="100vw"
      // `object-cover` and centred: artwork at the suggested proportions fills
      // the strip exactly, and anything squarer is cropped to a band through
      // its middle rather than making the bar tall enough to bury the page.
      className="object-cover object-center"
    />
  );

  return (
    <>
      <div
        className={`fixed inset-x-0 top-0 z-60 overflow-hidden bg-blue ${size.strip}`}
      >
        {banner.href ? (
          <Link href={banner.href} className="relative block size-full">
            {strip}
          </Link>
        ) : (
          <div className="relative size-full">{strip}</div>
        )}
      </div>

      {/* The strip is fixed, so it is out of the flow and the page would open
          underneath it. This puts the height back — everything below shifts
          down by exactly the strip, the header included, and no page needs to
          know the banner exists. */}
      <div className={size.strip} aria-hidden="true" />
    </>
  );
}
