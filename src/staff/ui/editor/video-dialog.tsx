"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

import { readVideoUrl, VIDEO_LABELS, type VideoProvider } from "./nodes";

/**
 * Adding a video, in the panel's own furniture.
 *
 * This was two `window.prompt`s and a `window.alert`. They worked, and they
 * were the wrong thing three times over: a browser prompt is styled by the
 * browser and looks like nothing else in the panel, it renders the address
 * field as a single line of unstyled text with no room for the paragraph
 * explaining what may go in it, and its validation can only happen after it
 * has closed — so a mistyped address meant an alert, then starting again.
 *
 * The same three questions, asked in the panel's own dialog: what is the
 * address, what should it be called, and — answered continuously rather than
 * at the end — is that address one we can actually play.
 */

export function VideoDialog({
  onAdd,
  onClose,
}: {
  onAdd: (video: { provider: VideoProvider; videoId: string; title: string }) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  // Only after an attempt. Marking an address invalid while it is still being
  // typed is telling somebody they are wrong before they have finished.
  const [tried, setTried] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    urlRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const video = useMemo(() => readVideoUrl(url), [url]);
  const typed = url.trim().length > 0;

  const submit = () => {
    setTried(true);
    if (!video) {
      urlRef.current?.focus();
      return;
    }
    onAdd({ ...video, title: title.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-end justify-center bg-gray/50 p-0 sm:items-center sm:p-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-dialog-title"
        className="flex w-full max-w-xl flex-col rounded-t-card bg-white sm:rounded-card"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-15 p-5">
          <div>
            <h2
              id="video-dialog-title"
              className="text-xl font-bold tracking-[-0.02em] text-blue"
            >
              Add a video
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-gray">
              It plays on the published page. Nothing is uploaded here.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-gray transition-colors duration-300 hover:bg-blue-08 hover:text-blue"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-6 p-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="video-url"
              className="text-[15px] font-medium text-blue"
            >
              Address
            </label>
            <p id="video-url-help" className="text-[13px] leading-relaxed text-gray-80">
              A link from YouTube, Vimeo, Instagram, Facebook, TikTok or
              LinkedIn, or a direct link to an .mp4 or .webm file. Copy it from
              the browser’s address bar, or from the post’s own Share or Copy
              link.
            </p>
            <input
              ref={urlRef}
              id="video-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submit();
                }
              }}
              aria-describedby="video-url-help"
              aria-invalid={tried && !video}
              placeholder="https://www.instagram.com/reel/…"
              className={`w-full rounded-card border bg-white px-4 py-3 text-[15px] text-gray outline-none ${
                tried && !video ? "border-blue" : "border-gray-15 focus:border-blue"
              }`}
            />

            {/* What the address was understood to be, as it is typed. The
                question people actually have here is "did that work", and
                answering it continuously is worth more than a button that
                only refuses at the end. */}
            {typed && video && (
              <p className="text-[13px] text-gray">
                Recognised as{" "}
                <strong className="font-semibold text-blue">
                  {VIDEO_LABELS[video.provider]}
                </strong>
                {video.provider !== "file" && ` — ${video.videoId}`}.
              </p>
            )}
            {typed && !video && (
              /* Names what is accepted rather than only what was refused. The
                 message this replaced listed two of the seven and left
                 somebody with an Instagram link to conclude the panel could
                 not take one — which, until now, it could not. */
              <p role="alert" className="text-[13px] leading-relaxed text-blue">
                That address was not recognised. It needs to be a link to a
                YouTube, Vimeo, Instagram, Facebook, TikTok or LinkedIn post,
                or a file ending in .mp4 or .webm. A private post will not
                work — the address has to be one anybody can open.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="video-title"
              className="text-[15px] font-medium text-blue"
            >
              Title <span className="font-normal text-gray-80">(optional)</span>
            </label>
            <p id="video-title-help" className="text-[13px] leading-relaxed text-gray-80">
              What the video shows. Read out by screen readers, and used by
              search engines.
            </p>
            <input
              id="video-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submit();
                }
              }}
              aria-describedby="video-title-help"
              placeholder="e.g. Graduation day at FXBVillage Mageragere"
              className="w-full rounded-card border border-gray-15 bg-white px-4 py-3 text-[15px] text-gray outline-none focus:border-blue"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-15 p-5">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray underline underline-offset-4 transition-colors duration-300 hover:text-blue"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!video}
            className="inline-flex h-11 items-center rounded-full bg-blue px-6 text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-blue-90 disabled:opacity-40"
          >
            Add video
          </button>
        </div>
      </div>
    </div>
  );
}
