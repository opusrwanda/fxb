"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoRendition } from "@/lib/media";

type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: string;
};

/**
 * Looping background video that is never allowed to slow the page down.
 *
 * The poster is what paints — it is a normal optimised image rendered by the
 * caller behind this component, and it carries the LCP. The video element is
 * not even mounted until the browser is idle after hydration, so it cannot
 * compete with HTML, CSS, fonts or the poster for bandwidth. Once it can play
 * it fades in over the poster.
 *
 * It is skipped entirely, leaving the poster in place, when:
 *   - the visitor asked for reduced motion,
 *   - the browser reports Save-Data, or
 *   - the connection reports itself as 2g or slower.
 *
 * That last pair matters more here than usual: a large share of this audience
 * is on Rwandan mobile data, and none of them should pay several megabytes for
 * decoration.
 */
export function BackgroundVideo({
  large,
  small,
  poster,
  className = "",
}: {
  large: VideoRendition;
  small: VideoRendition;
  poster: string;
  className?: string;
}) {
  const [rendition, setRendition] = useState<VideoRendition | null>(null);
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const connection = (
      navigator as Navigator & { connection?: NetworkInformation }
    ).connection;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      connection?.saveData === true ||
      /^(slow-)?2g$/.test(connection?.effectiveType ?? "")
    ) {
      return;
    }

    const start = () =>
      setRendition(window.innerWidth > 1024 ? large : small);

    // Wait for idle so the video never competes with the critical path.
    // Safari below 17 has no requestIdleCallback, hence the timeout fallback.
    const idle: typeof window.requestIdleCallback | undefined =
      window.requestIdleCallback;

    if (idle) {
      const id = idle(start, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }

    const id = window.setTimeout(start, 1200);
    return () => window.clearTimeout(id);
  }, [large, small]);

  if (!rendition) return null;

  return (
    <video
      ref={videoRef}
      className={`transition-opacity duration-700 ease-out ${
        ready ? "opacity-100" : "opacity-0"
      } ${className}`}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster={poster}
      aria-hidden="true"
      tabIndex={-1}
      onCanPlay={() => setReady(true)}
    >
      <source src={rendition.webm} type="video/webm" />
      <source src={rendition.mp4} type="video/mp4" />
    </video>
  );
}
