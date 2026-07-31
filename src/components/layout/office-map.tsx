"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";
import { org } from "@/lib/site";

/**
 * The office location, on a map the visitor asks for.
 *
 * A Google Maps embed is well over a megabyte of scripts and tiles, and it sets
 * third-party cookies the moment it loads. This site's audience is largely on
 * Rwandan mobile data — the same reasoning that keeps the hero video off the
 * critical path applies here, with a privacy argument on top.
 *
 * So the map is a button until it is wanted. The address, the directions link
 * and the office hours are all present without it; pressing Show map swaps in
 * the iframe. Nothing is lost by never pressing it.
 */
export function OfficeMap() {
  const [shown, setShown] = useState(false);

  const query = encodeURIComponent(
    `FXB Rwanda, ${org.address.line}, ${org.address.district}, ${org.address.country}`
  );

  return (
    <div className="wedge relative aspect-4/3 overflow-hidden bg-blue-08 sm:aspect-16/10">
      {shown ? (
        <iframe
          // No API key needed for the plain embed, and no account tied to it.
          src={`https://www.google.com/maps?q=${query}&output=embed`}
          title={`Map showing ${org.name}, ${org.address.district}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="size-full border-0"
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-5 p-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-blue">
            <MapPin className="size-6 text-white" aria-hidden="true" />
          </span>
          <p className="max-w-[34ch] text-base leading-relaxed text-gray">
            {org.address.line}, {org.address.district}, {org.address.country}
          </p>
          <button
            type="button"
            onClick={() => setShown(true)}
            className="rounded-full bg-blue px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-90"
          >
            Show map
          </button>
          <p className="max-w-[38ch] text-xs leading-relaxed text-gray-80">
            The map is loaded from Google only when you ask for it.
          </p>
        </div>
      )}
    </div>
  );
}
