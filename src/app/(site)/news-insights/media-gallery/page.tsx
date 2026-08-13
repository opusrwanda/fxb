import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { SubNav, newsInsightsNav } from "@/components/layout/sub-nav";
import { Reveal } from "@/components/ui/reveal";
import { photos, type PhotoGroup } from "@/lib/photos";

export const metadata: Metadata = {
  title: "Media Gallery",
  description:
    "Photographs from FXB Rwanda's programmes across Rwanda — FXBVillage, Sugira Muryango, Kungahara-FOSTERING and more.",
};

/**
 * Media Gallery.
 *
 * The supplied library, grouped by the programme each set was shot for. Groups
 * are labelled here because the folder names they arrived under are storage
 * paths, not titles a visitor should read.
 *
 * The photographs are laid out in a masonry-ish column flow rather than a
 * uniform grid: the set mixes landscape and portrait, and forcing both into one
 * aspect ratio would crop somebody out of half of them.
 *
 * No lightbox. It would mean shipping the full-size file on tap to an audience
 * largely on mobile data, for a gallery that is already the point of the page.
 * Each photograph is served at the size it is displayed.
 */
const GROUP_LABELS: Record<PhotoGroup, string> = {
  "fxbvillage-tlf": "FXBVillage",
  "fxbvillage-musambira": "FXBVillage — Musambira",
  "fxbvillage-mageragere": "FXBVillage — Mageragere",
  "sugira-muryango": "Sugira Muryango",
  fostering: "Kungahara-FOSTERING",
  "itap-closing-rwamagana": "ITAP closing — Rwamagana",
};

/** Display order: the largest sets first, so the page opens with substance. */
const GROUP_ORDER: PhotoGroup[] = [
  "fxbvillage-tlf",
  "sugira-muryango",
  "fostering",
  "fxbvillage-musambira",
  "fxbvillage-mageragere",
  "itap-closing-rwamagana",
];

export default function MediaGalleryPage() {
  return (
    <>
      <PageHeader
        path="/news-insights/media-gallery"
        breadcrumbs={[{ label: "News & Insights", href: "/news-insights" }]}
        eyebrow="MEDIA GALLERY"
        title="The work, as photographed"
        intro={`${photos.length} photographs from our programmes across Rwanda.`}
      />

      <SubNav items={newsInsightsNav} ariaLabel="News and Insights" />

      <section className="bg-white pt-14 pb-24 lg:pt-16 lg:pb-32">
        <Container className="flex flex-col gap-16 lg:gap-24">
          {GROUP_ORDER.map((group) => {
            const set = photos.filter((item) => item.group === group);
            if (set.length === 0) return null;

            return (
              <div key={group}>
                <Reveal className="flex items-baseline gap-4">
                  <h2 className="text-2xl font-bold tracking-[-0.02em] text-blue lg:text-[28px]">
                    {GROUP_LABELS[group]}
                  </h2>
                  <span className="text-sm text-gray-80">
                    {set.length}{" "}
                    {set.length === 1 ? "photograph" : "photographs"}
                  </span>
                </Reveal>

                {/* CSS columns, so a portrait sits at its own height instead of
                    being cropped square. */}
                <div className="mt-8 columns-1 gap-5 sm:columns-2 lg:columns-3">
                  {set.map((item, index) => (
                    <Reveal
                      key={item.src}
                      delay={Math.min(index, 3) * 60}
                      className="mb-5 break-inside-avoid"
                    >
                      <Image
                        src={item.url}
                        // Decorative in aggregate: the group heading above says
                        // what the set is, and no per-file description was
                        // supplied. Inventing 43 captions would be worse than
                        // none.
                        alt=""
                        width={item.width}
                        height={item.height}
                        sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
                        className="w-full rounded-card"
                      />
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })}
        </Container>
      </section>
    </>
  );
}
