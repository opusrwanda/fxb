import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  // A stray lockfile in the home directory makes Next infer the wrong root.
  turbopack: {
    root: __dirname,
  },

  images: {
    // Photography and video live in the Bunny storage zone and are delivered
    // from its pull zone. next/image still resizes and converts them to
    // AVIF/WebP per breakpoint, so the CDN holds one 2400px master per photo
    // rather than a rendition ladder.
    remotePatterns: [
      { protocol: "https", hostname: "fxbwebsite.b-cdn.net", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  async redirects() {
    return [
      /**
       * Page banners stopped being a screen of their own.
       *
       * The photograph behind a page's title is part of that page's header, so
       * it is set in the header's own form under Page sections rather than on a
       * separate list of routes. Anybody with the old address bookmarked lands
       * where the banners now are.
       */
      {
        source: "/staff/page-banners",
        destination: "/staff/sections",
        permanent: false,
      },
      {
        source: "/staff/page-banners/:id",
        destination: "/staff/sections",
        permanent: false,
      },
      {
        // The section landing showed a three-item teaser under a tab bar whose
        // lit tab said "Latest News" — so arriving at News & Insights gave you
        // a preview of the news and a control you still had to click to reach
        // the actual news. Two pages for one job, and the first one was in the
        // way. The listing is the landing now.
        source: "/news-insights",
        destination: "/news-insights/news",
        permanent: false,
      },
      /**
       * The two sections stopped overlapping, and three addresses moved.
       *
       * Our Impact and News & Insights each listed Publications, the Media
       * Gallery and the same three stories, so half of each menu was the other
       * one. They were split on what a reader is after — what changed, versus
       * what is new — and the pages followed their menus: stories to Our
       * Impact, the gallery to News & Insights.
       *
       * PERMANENT, unlike the temporary redirect that used to sit here. The
       * old one existed because nobody had decided which of two duplicate URLs
       * was canonical; that is decided now, and a 308 is what tells a search
       * engine to move the ranking across rather than treat the new address as
       * a second copy. Three stories are already indexed at the old paths.
       */
      {
        source: "/news-insights/stories",
        destination: "/our-impact/stories",
        permanent: true,
      },
      {
        source: "/news-insights/stories/:slug",
        destination: "/our-impact/stories/:slug",
        permanent: true,
      },
      {
        source: "/our-impact/media-gallery",
        destination: "/news-insights/media-gallery",
        permanent: true,
      },
      {
        // Never a real page — it was the Our Impact menu's name for the
        // stories listing, back when both menus had one. Kept because it has
        // been in the nav and may be bookmarked.
        source: "/our-impact/success-stories",
        destination: "/our-impact/stories",
        permanent: true,
      },
    ];
  },

  async headers() {
    // In development Turbopack reuses the same URL for a CSS chunk whose
    // contents keep changing, and serves it as `no-cache` — which Safari
    // treats as "may reuse without revalidating" for subresources. The result
    // is a refresh that pairs fresh HTML with a stale stylesheet: newer
    // utilities simply have no rule, so type collapses to inherited sizes and
    // gradients vanish. `no-store` forces a real fetch every time.
    //
    // Development only. Production builds are content-hashed and must stay
    // aggressively cacheable.
    if (!isDev) return [];

    // Everything, not just /_next/static. Turbopack renames the CSS chunk
    // whenever the module graph changes, so a cached *document* is just as
    // damaging as a cached stylesheet: the stale HTML keeps pointing at the
    // previous chunk, and every class added since simply has no rule.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
