import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { getPageHeaderImage } from "@/cms/content/page-headers";

/**
 * The opening block for pages that do not carry a hero.
 *
 * Routes listed in `TRANSPARENT_HEADER_ROUTES` open onto footage and must start
 * with `<Hero>`; everything else — the project listings, careers, procurement,
 * the publication pages — opens with this.
 *
 * TWO TREATMENTS, ONE COMPONENT
 *
 * With a photograph behind it this is the hero room at half height: full-bleed
 * picture, the same shaped scrim and grain, white type. Without one it is the
 * white block it has always been, blue type on white.
 *
 * Which one it gets is a CMS decision, not a code one — `/staff` → Page banners
 * holds a row per route plus a `*` default. No photograph set anywhere and every
 * page header looks exactly as it did before, which is what makes this safe to
 * ship ahead of the pictures.
 *
 * The scrim is not decoration here any more than it is in the hero: it is what
 * guarantees white type over a photograph nobody has vetted for contrast. Its
 * geometry is documented in globals.css.
 *
 * The top padding clears the pinned bar (64px on mobile, 72px from `lg`) and
 * then sets the page's own opening space, so the heading never sits under the
 * header on load or after an in-page jump.
 */
export type Crumb = { label: string; href: string };

export async function PageHeader({
  eyebrow,
  title,
  intro,
  breadcrumbs = [],
  path,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  breadcrumbs?: Crumb[];
  /**
   * The route, so the block can find its own banner. Omitted, it falls back to
   * the site-wide default — which is the right answer for the pages that have
   * no banner of their own and for dynamic routes, where a per-article
   * photograph would be the article's own image rather than this.
   */
  path?: string;
}) {
  const banner = await getPageHeaderImage(path);

  return (
    <section
      className={`relative isolate ${
        banner
          ? "overflow-hidden bg-blue pt-32 pb-16 lg:pt-48 lg:pb-24"
          : "bg-white pt-28 pb-16 lg:pt-40 lg:pb-20"
      }`}
    >
      {banner && (
        <>
          <Image
            src={banner.url}
            // Decorative: the page says what it is in the h1 directly over it,
            // and a description of the photograph read out first would only
            // delay that.
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover"
          />
          <div className="hero-scrim absolute inset-0 -z-10" aria-hidden="true" />
          <div
            className="hero-scrim-edges absolute inset-0 -z-10"
            aria-hidden="true"
          />
          <div className="grain absolute inset-0 -z-10" aria-hidden="true" />
        </>
      )}

      <Container className="flex flex-col gap-6">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb">
            <ol
              className={`flex flex-wrap items-center gap-1.5 text-sm ${
                banner ? "text-white-94" : "text-gray-80"
              }`}
            >
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center gap-1.5">
                  <Link
                    href={crumb.href}
                    className={`transition-colors duration-300 ${
                      banner ? "hover:text-white" : "hover:text-blue"
                    }`}
                  >
                    {crumb.label}
                  </Link>
                  {/* Separators go between crumbs only. The current page is the
                      `h1` directly below, so a trailing chevron would point at
                      nothing. */}
                  {index < breadcrumbs.length - 1 && (
                    <ChevronRight className="size-3.5" aria-hidden="true" />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {eyebrow && (
          <div className="flex items-center gap-4">
            <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
            <span
              className={`text-[24px] font-semibold tracking-[0.14em] ${
                banner ? "text-white" : "text-gray-80"
              }`}
            >
              {eyebrow}
            </span>
          </div>
        )}

        <h1
          className={`max-w-[20ch] text-4xl font-bold tracking-[-0.03em] sm:text-5xl lg:text-[64px] lg:leading-[1.05] ${
            banner ? "text-white" : "text-blue"
          }`}
        >
          {title}
        </h1>

        {intro && (
          <p
            className={`max-w-[58ch] text-base leading-relaxed lg:text-lg lg:font-light ${
              banner ? "text-white-94" : "text-gray"
            }`}
          >
            {intro}
          </p>
        )}
      </Container>
    </section>
  );
}
