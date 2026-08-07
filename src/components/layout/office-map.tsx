import { ArrowUpRight, MapPin } from "lucide-react";
import type { SiteDetails } from "@/cms/content/settings";

/**
 * The office, on Google's own map.
 *
 * This was a click-to-load placeholder: a pin, the address and a "Show map"
 * button that swapped in the iframe only when pressed. The reasoning was sound
 * — a Maps embed is around a megabyte of scripts and tiles and it sets
 * third-party cookies the moment it loads, and this audience is largely on
 * Rwandan mobile data. But it meant the contact page of an organisation with a
 * head office did not show where the head office is, and someone trying to
 * drive there had to ask twice.
 *
 * The map is shown. What is kept from the old approach is `loading="lazy"`, so
 * the embed is not fetched until it is close to the viewport — a visitor who
 * only came for the phone number, at the top of the page, still never pays for
 * it. That is most of the saving for none of the cost.
 *
 * The embed URL comes from Google's own Share > Embed a map and carries the
 * place id, so the pin is FXB Rwanda Headquarters rather than a guess at the
 * address string. See `site.ts`.
 *
 * No longer a client component: there is no state left to hold.
 */
export function OfficeMap({ details }: { details: SiteDetails }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="wedge relative aspect-4/3 overflow-hidden bg-blue-08 sm:aspect-16/10">
        <iframe
          src={details.mapEmbedUrl}
          title={`Map showing ${details.name} headquarters in ${details.address.district}`}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="size-full border-0"
        />
      </div>

      {/* The embed pans and zooms but will not route. Anyone who actually needs
          to get here wants the app, not the picture. */}
      <a
        href={details.mapUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="group inline-flex items-center gap-2.5 text-base font-semibold text-blue"
      >
        <MapPin className="size-4 shrink-0" aria-hidden="true" />
        Get directions
        <ArrowUpRight
          className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true"
        />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </div>
  );
}
