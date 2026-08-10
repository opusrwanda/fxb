"use client";

import { DecoratorNode, type LexicalNode, type NodeKey, type SerializedLexicalNode, type Spread } from "lexical";
import type { JSX } from "react";

/**
 * Pictures and video inside an article.
 *
 * Lexical stores a tree of nodes and knows nothing about images — everything
 * beyond text, headings, lists and links is the application's to define. These
 * two are `DecoratorNode`s, which is Lexical's term for a node that renders
 * React rather than editable text: the writer sees the picture, the cursor
 * treats it as one indivisible thing, and backspace removes it whole.
 *
 * WHAT IS STORED, AND WHY SO LITTLE
 *
 * An image node stores a `src`, an `alt` and a `mediaId`, and nothing about
 * size, alignment or float. That is the same decision the toolbar documents —
 * typography and layout belong to the design system, not to whoever is writing
 * the article — and it is what stops an article from slowly stopping looking
 * like the rest of the site. `Prose` decides how a figure sits in the measure.
 *
 * `mediaId` is not used for rendering. It is there so a future question — what
 * is this photograph used by? — has an answer that does not involve matching
 * URLs with a regular expression.
 *
 * The site renders these from the stored JSON in `lexical/render.tsx`, not
 * from this file; these classes exist only inside the editor.
 */

/* ── Image ────────────────────────────────────────────────────────────────── */

export type SerializedImageNode = Spread<
  { src: string; alt: string; mediaId: number | null },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __alt: string;
  __mediaId: number | null;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__alt, node.__mediaId, node.__key);
  }

  constructor(src: string, alt: string, mediaId: number | null, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__mediaId = mediaId;
  }

  static importJSON(serialized: SerializedImageNode): ImageNode {
    return new ImageNode(serialized.src, serialized.alt ?? "", serialized.mediaId ?? null);
  }

  exportJSON(): SerializedImageNode {
    return {
      type: "image",
      version: 1,
      src: this.__src,
      alt: this.__alt,
      mediaId: this.__mediaId,
    };
  }

  /**
   * The element Lexical puts the React render inside.
   *
   * A block-level wrapper, because a picture in this system is always its own
   * band in the flow — there is no inline image and no text wrapping around
   * one.
   */
  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.className = "my-5";
    return div;
  }

  updateDOM(): false {
    return false;
  }

  isInline(): boolean {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <figure className="overflow-hidden rounded-card border border-gray-15">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={this.__src} alt={this.__alt} className="block w-full" />
        <figcaption className="border-t border-gray-15 bg-blue-08 px-4 py-2 text-[13px] text-gray">
          {this.__alt || (
            // Said plainly rather than left blank. A missing description is
            // invisible on the page and total for somebody using a screen
            // reader, so the editor is the only place it can be noticed.
            <span className="text-gray-80">
              No description — add one on the Media page.
            </span>
          )}
        </figcaption>
      </figure>
    );
  }
}

export function $createImageNode(src: string, alt: string, mediaId: number | null): ImageNode {
  return new ImageNode(src, alt, mediaId);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}

/* ── Video ────────────────────────────────────────────────────────────────── */

/**
 * Where the video comes from.
 *
 * `youtube` and `vimeo` are embeds and store only the id; `file` is something
 * in the media library and stores its URL. Keeping the provider explicit means
 * the renderer never has to guess from the shape of a URL, and an embed that
 * stores an id rather than a full URL cannot be turned into a link to
 * something else by an edit to the JSON.
 */
export type VideoProvider = "youtube" | "vimeo" | "file";

export type SerializedVideoNode = Spread<
  { provider: VideoProvider; videoId: string; title: string },
  SerializedLexicalNode
>;

export class VideoNode extends DecoratorNode<JSX.Element> {
  __provider: VideoProvider;
  __videoId: string;
  __title: string;

  static getType(): string {
    return "video";
  }

  static clone(node: VideoNode): VideoNode {
    return new VideoNode(node.__provider, node.__videoId, node.__title, node.__key);
  }

  constructor(provider: VideoProvider, videoId: string, title: string, key?: NodeKey) {
    super(key);
    this.__provider = provider;
    this.__videoId = videoId;
    this.__title = title;
  }

  static importJSON(serialized: SerializedVideoNode): VideoNode {
    return new VideoNode(
      serialized.provider ?? "youtube",
      serialized.videoId ?? "",
      serialized.title ?? "",
    );
  }

  exportJSON(): SerializedVideoNode {
    return {
      type: "video",
      version: 1,
      provider: this.__provider,
      videoId: this.__videoId,
      title: this.__title,
    };
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.className = "my-5";
    return div;
  }

  updateDOM(): false {
    return false;
  }

  isInline(): boolean {
    return false;
  }

  /**
   * A card, not the video.
   *
   * Deliberately not an iframe. A YouTube embed inside a contenteditable
   * swallows clicks meant for the editor, loads a tracking frame into the
   * panel, and cannot be selected or deleted like the block it is. What the
   * writer needs to know is that a video is here and which one — the reader is
   * the one who needs it to play.
   */
  decorate(): JSX.Element {
    const label =
      this.__provider === "file"
        ? "Video file"
        : this.__provider === "vimeo"
          ? "Vimeo"
          : "YouTube";

    return (
      <div className="flex items-center gap-4 rounded-card border border-gray-15 bg-blue-08 px-5 py-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue text-white">
          {/* Inline rather than a lucide import: this renders outside React's
              tree through Lexical's decorator, and one triangle is not worth
              the dependency. */}
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] font-medium text-blue">
            {this.__title || label}
          </span>
          <span className="block truncate text-sm text-gray">
            {label} — plays on the published page
          </span>
        </span>
      </div>
    );
  }
}

export function $createVideoNode(
  provider: VideoProvider,
  videoId: string,
  title: string,
): VideoNode {
  return new VideoNode(provider, videoId, title);
}

export function $isVideoNode(node: LexicalNode | null | undefined): node is VideoNode {
  return node instanceof VideoNode;
}

/**
 * Read a pasted address and work out what it points at.
 *
 * Handles what people actually paste: a watch URL, a `youtu.be` short link, an
 * embed URL, a Vimeo page, and a direct link to a video file. Anything else
 * returns null and the toolbar says so, rather than inserting a block that
 * renders as an empty frame on the live site.
 */
export function readVideoUrl(
  raw: string,
): { provider: VideoProvider; videoId: string } | null {
  const url = raw.trim();
  if (!url) return null;

  const youtube = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (youtube) return { provider: "youtube", videoId: youtube[1] };

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { provider: "vimeo", videoId: vimeo[1] };

  // A file, either in the library or anywhere else that serves one.
  if (/^(https?:\/\/|\/)[^\s]+\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url)) {
    return { provider: "file", videoId: url };
  }

  return null;
}
