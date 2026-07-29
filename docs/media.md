# Media pipeline

## Hero video

The source clip is 4K/50fps and ~119 MB. It is never served as-is. The hero
sits under a blue scrim at up to 90% opacity, so almost no detail survives to
the viewer — that is what lets us compress hard without a visible cost.

Encoding, from `Hero Video (To be changed later).mp4`:

1. Decode the 4K source once into a light-denoised 720p mezzanine at 24fps.
   Denoising is the biggest single win: handheld 4K carries sensor noise that
   otherwise eats bitrate encoding grain nobody can see.
2. From the mezzanine, produce four renditions with two-pass VBR so sizes are
   predictable rather than content-dependent:

   | File            | Size        | Bitrate | Used for      |
   | --------------- | ----------- | ------- | ------------- |
   | `hero-720.webm` | VP9 1280×720 | 600k   | desktop       |
   | `hero-720.mp4`  | H.264 1280×720 | 800k | desktop, Safari |
   | `hero-480.webm` | VP9 854×480  | 340k   | mobile        |
   | `hero-480.mp4`  | H.264 854×480 | 450k  | mobile, Safari |

   All are muted (`-an`), 24fps, and MP4s carry `+faststart` so playback can
   begin before the file finishes downloading.

3. The poster is frame 0 — the same frame the loop starts on, so there is no
   jump when the video takes over. It lives in `public/media/` and is served
   through `next/image`, which converts it to AVIF/WebP per browser.

## Delivery

Video is uploaded to the Bunny.net storage zone and served from the pull zone.
The Next.js origin only ever sends HTML and the poster.

```
node scripts/upload-to-bunny.mjs .../hero-720.mp4 video/hero-720.mp4
node scripts/upload-to-bunny.mjs --list video
```

Credentials live in `.env.local` (gitignored). See `.env.example`.

## Loading policy

`BackgroundVideo` never blocks the page:

- The poster carries the LCP; the `<video>` element is not mounted until the
  browser is idle after hydration, so it cannot compete for bandwidth.
- It is skipped entirely — poster only — under `prefers-reduced-motion`, when
  the browser reports `Save-Data`, or when the connection reports 2g or slower.
  A large share of this audience is on Rwandan mobile data and none of them
  should pay megabytes for decoration.
- The rendition is chosen in JS from the viewport width. The `media` attribute
  on `<source>` is ignored inside `<video>`, so it cannot be used here.
