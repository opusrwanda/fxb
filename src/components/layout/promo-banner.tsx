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
 * own offset. Three copies of `h-14` would be three chances for the header to
 * overlap the banner by four pixels on one breakpoint.
 */

/** The strip's height, and the two measurements derived from it. */
export const PROMO_HEIGHT = "h-11 sm:h-12 lg:h-14";
export const PROMO_OFFSET = "top-11 sm:top-12 lg:top-14";

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
        className={`fixed inset-x-0 top-0 z-60 overflow-hidden bg-blue ${PROMO_HEIGHT}`}
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
      <div className={PROMO_HEIGHT} aria-hidden="true" />
    </>
  );
}
