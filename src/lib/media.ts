/**
 * Assets served from Bunny.net.
 *
 * Video never ships from the Next.js origin: it is uploaded to the Bunny
 * storage zone and delivered from the pull zone, so the app server only ever
 * sends HTML and the small poster image.
 */
const CDN = process.env.NEXT_PUBLIC_CDN_URL ?? "";

export function cdn(path: string): string {
  return `${CDN}/${path.replace(/^\//, "")}`;
}

export type VideoRendition = { webm: string; mp4: string };

export const heroVideo = {
  /**
   * The `media` attribute on `<source>` is ignored inside `<video>`, so the
   * rendition is chosen in JS from the viewport width instead.
   */
  large: {
    webm: cdn("video/hero-720.webm"),
    mp4: cdn("video/hero-720.mp4"),
  } satisfies VideoRendition,
  small: {
    webm: cdn("video/hero-480.webm"),
    mp4: cdn("video/hero-480.mp4"),
  } satisfies VideoRendition,
  poster: "/media/hero-poster.jpg",
  posterWidth: 3840,
  posterHeight: 2160,
} as const;
