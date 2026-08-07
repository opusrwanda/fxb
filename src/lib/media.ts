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
  /**
   * 1080p above 1024px, 480p below it.
   *
   * The large rendition used to be 720p at 0.60 Mbps, which is about a quarter
   * of the rate that resolution wants — and it was then stretched across a
   * full-bleed hero, some 2.4x past its native width on a retina laptop. Soft
   * footage and visible blocking, from both ends at once.
   *
   * 1080p at ~1.8 Mbps costs 10.3MB against the old 3.5MB, and that is a real
   * cost this site does not spend lightly. It is bounded, though: the small
   * rendition still covers every phone, and reduced-motion, Save-Data and 2G
   * visitors are served no video at all. The three megabytes buys nothing if
   * the result looks like a bad stream.
   */
  large: {
    webm: cdn("video/hero-1080.webm"),
    mp4: cdn("video/hero-1080.mp4"),
  } satisfies VideoRendition,
  small: {
    webm: cdn("video/hero-480.webm"),
    mp4: cdn("video/hero-480.mp4"),
  } satisfies VideoRendition,
  poster: "/media/hero-poster.jpg",
  posterWidth: 3840,
  posterHeight: 2160,
} as const;
