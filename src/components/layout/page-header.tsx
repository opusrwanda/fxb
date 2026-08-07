import { Hero, type Crumb } from "@/components/sections/hero";
import { getPageHeaderImage } from "@/cms/content/page-headers";

/**
 * The opening block for pages that do not carry the home page's footage.
 *
 * It is the hero room, and nothing else. This used to be a second, shorter
 * opening block with its own proportions — white ground, 64px title, its own
 * padding — which meant the site had two ways of starting a page and a visitor
 * met a different one depending on which link they followed. Who We Are opened
 * onto a photograph; Careers opened onto a white strip.
 *
 * So it delegates rather than imitates. Same height, same type, same scrim and
 * grain over the same CMS photograph, and the same sentinels — which is what
 * lets the header sit transparent over the picture here exactly as it does on
 * the section landings. Matching a spec by copying its class names is how two
 * components drift; this one cannot.
 *
 * What survives from the old block is the breadcrumb trail, which moved into
 * `Hero` with it. The pages that need a trail were the only reason a second
 * opening block existed.
 *
 * Video stays home-only. `Hero` takes a still here, never footage.
 */
export type { Crumb };

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
   * The route, so the room can find its own photograph. Omitted, it falls back
   * to the site-wide default — the right answer for dynamic routes, where a
   * per-article picture would be the article's own rather than this.
   */
  path?: string;
}) {
  const banner = await getPageHeaderImage(path);

  return (
    <Hero
      eyebrow={eyebrow}
      headline={title}
      body={intro}
      image={banner}
      breadcrumbs={breadcrumbs}
    />
  );
}
