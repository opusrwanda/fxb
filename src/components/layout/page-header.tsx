import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/layout/container";

/**
 * The opening block for pages that do not carry a hero.
 *
 * Routes listed in `TRANSPARENT_HEADER_ROUTES` open onto footage and must start
 * with `<Hero>`; everything else — the project listings, careers, procurement,
 * the publication pages — opens onto white with the header already solid. This
 * is what those pages start with instead.
 *
 * The top padding clears the pinned bar (64px on mobile, 72px from `lg`) and
 * then sets the page's own opening space, so the heading never sits under the
 * header on load or after an in-page jump.
 */
export type Crumb = { label: string; href: string };

export function PageHeader({
  eyebrow,
  title,
  intro,
  breadcrumbs = [],
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  breadcrumbs?: Crumb[];
}) {
  return (
    <section className="bg-white pt-28 pb-16 lg:pt-40 lg:pb-20">
      <Container className="flex flex-col gap-6">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-80">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center gap-1.5">
                  <Link
                    href={crumb.href}
                    className="transition-colors duration-200 hover:text-blue"
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
            <span className="text-xs font-semibold tracking-[0.14em] text-gray-80">
              {eyebrow}
            </span>
          </div>
        )}

        <h1 className="max-w-[20ch] text-4xl font-bold tracking-[-0.03em] text-blue sm:text-5xl lg:text-[64px] lg:leading-[1.05]">
          {title}
        </h1>

        {intro && (
          <p className="max-w-[58ch] text-base leading-relaxed text-gray lg:text-lg">
            {intro}
          </p>
        )}
      </Container>
    </section>
  );
}
