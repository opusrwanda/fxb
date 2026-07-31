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
      {
        // The nav lists "Success Stories" under Our Impact and "Stories" under
        // News & Insights, but they are the same three stories. Rather than
        // publish them at two URLs — which splits the ranking and doubles the
        // maintenance — the Our Impact route redirects to the canonical one.
        // Temporary, not permanent: which of the two should be canonical is
        // FXB's call, and a 308 would be cached in browsers for good.
        source: "/our-impact/success-stories",
        destination: "/news-insights/stories",
        permanent: false,
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
