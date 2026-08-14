"use client";

import { DecoratorNode, type LexicalNode, type NodeKey, type SerializedLexicalNode, type Spread } from "lexical";
import type { JSX } from "react";

import { EditorImage } from "./image-component";

/**
 * Pictures and video inside an article.
 *
 * Lexical stores a tree of nodes and knows nothing about images — everything
 * beyond text, headings, lists and links is the application's to define. These
 * two are `DecoratorNode`s, which is Lexical's term for a node that renders
 * React rather than editable text: the writer sees the picture, the cursor
 * treats it as one indivisible thing, and backspace removes it whole.
 *
 * WHAT IS STORED
 *
 * `src`, `alt`, `mediaId`, and — since FXB asked to be able to place a picture
 * rather than only insert one — a width, an alignment and whether text wraps
 * around it.
 *
 * This file used to say layout belonged to the design system and not to
 * whoever was writing, which is why an image node carried nothing but its
 * source. That was the right default and it was also the reason every
 * photograph in every article was a full-width band, including the ones that
 * were portraits of one person. The controls below are deliberately narrow —
 * three alignments, a percentage width, wrap on or off — rather than free
 * coordinates, so an author can place a picture without being able to invent
 * a layout the rest of the site has never used.
 *
 * THE WIDTH IS A PERCENTAGE, not pixels. The editor drags in pixels because
 * that is what a mouse does, and converts on release: the prose column is a
 * different width on a laptop and a phone, and a picture stored as "440px"
 * would be two-thirds of the column on one and wider than the screen on the
 * other.
 *
 * `mediaId` is not used for rendering. It is there so a future question — what
 * is this photograph used by? — has an answer that does not involve matching
 * URLs with a regular expression.
 *
 * The site renders these from the stored JSON in `lexical/render.tsx`, not
 * from this file; these classes exist only inside the editor.
 */

/* ── Image ────────────────────────────────────────────────────────────────── */

/** Where the picture sits in the column. */
export type ImageAlign = "left" | "center" | "right";

/**
 * Everything about how one picture is placed.
 *
 * `width` is a percentage of the prose column, or null for the full width —
 * which is what every image inserted before these controls existed has, and is
 * why null rather than 100 is the default. The two are not the same thing to
 * read back: null means "nobody has chosen", 100 means "somebody chose full".
 *
 * `wrap` only means anything when aligned left or right. Text cannot flow
 * around a centred picture — there is no side for it to flow down — so the
 * editor hides the control when centre is chosen and the renderer ignores the
 * value if it survives from somewhere else.
 */
export type ImageLayout = {
  width: number | null;
  align: ImageAlign;
  wrap: boolean;
};

export const DEFAULT_IMAGE_LAYOUT: ImageLayout = {
  width: null,
  align: "center",
  wrap: false,
};

/** Narrow enough to still be a picture, wide enough to be worth wrapping. */
export const MIN_IMAGE_WIDTH = 15;
export const MAX_IMAGE_WIDTH = 100;

export const clampImageWidth = (value: number): number =>
  Math.min(MAX_IMAGE_WIDTH, Math.max(MIN_IMAGE_WIDTH, Math.round(value)));

export type SerializedImageNode = Spread<
  {
    src: string;
    alt: string;
    mediaId: number | null;
    width: number | null;
    align: ImageAlign;
    wrap: boolean;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __alt: string;
  __mediaId: number | null;
  __width: number | null;
  __align: ImageAlign;
  __wrap: boolean;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__alt,
      node.__mediaId,
      { width: node.__width, align: node.__align, wrap: node.__wrap },
      node.__key,
    );
  }

  constructor(
    src: string,
    alt: string,
    mediaId: number | null,
    layout: ImageLayout = DEFAULT_IMAGE_LAYOUT,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__mediaId = mediaId;
    this.__width = layout.width;
    this.__align = layout.align;
    this.__wrap = layout.wrap;
  }

  /**
   * Every field defaults, because most stored images predate them.
   *
   * An article written before these controls existed has image nodes with no
   * width, align or wrap in its JSON. Reading one must produce a full-width
   * centred picture — exactly what it rendered as yesterday — rather than
   * `undefined` reaching the DOM as a style.
   */
  static importJSON(serialized: SerializedImageNode): ImageNode {
    return new ImageNode(serialized.src, serialized.alt ?? "", serialized.mediaId ?? null, {
      width:
        typeof serialized.width === "number" ? clampImageWidth(serialized.width) : null,
      align: ALIGNMENTS.includes(serialized.align) ? serialized.align : "center",
      wrap: serialized.wrap === true,
    });
  }

  exportJSON(): SerializedImageNode {
    return {
      type: "image",
      version: 1,
      src: this.__src,
      alt: this.__alt,
      mediaId: this.__mediaId,
      width: this.__width,
      align: this.__align,
      wrap: this.__wrap,
    };
  }

  getLayout(): ImageLayout {
    return { width: this.__width, align: this.__align, wrap: this.__wrap };
  }

  /**
   * Change how it sits.
   *
   * `getWritable` is not optional. Lexical nodes are frozen once committed, and
   * assigning to `this.__width` on a read-only copy either throws or silently
   * updates a clone nothing is rendering — the second being the one that costs
   * an afternoon.
   */
  setLayout(layout: Partial<ImageLayout>): void {
    const writable = this.getWritable();
    if (layout.width !== undefined) {
      writable.__width = layout.width === null ? null : clampImageWidth(layout.width);
    }
    if (layout.align !== undefined) writable.__align = layout.align;
    if (layout.wrap !== undefined) writable.__wrap = layout.wrap;
  }

  /**
   * The element Lexical puts the React render inside.
   *
   * This wrapper is what participates in the text flow, so the float and the
   * width belong on it and not on anything React renders inside — a floated
   * element inside a non-floated block does not pull text alongside it.
   */
  createDOM(): HTMLElement {
    const div = document.createElement("div");
    applyImageLayout(div, this.getLayout());
    return div;
  }

  /**
   * The wrapper is edited in place rather than replaced.
   *
   * Returning `true` would have Lexical throw this element away and build a
   * new one on every nudge of the resize handle, which remounts the React
   * decorator inside it — so the drag you are in the middle of loses its
   * mouse capture on the first pixel. Mutating and returning `false` keeps the
   * same element, and the same drag, alive.
   */
  updateDOM(previous: ImageNode, dom: HTMLElement): false {
    if (
      previous.__width !== this.__width ||
      previous.__align !== this.__align ||
      previous.__wrap !== this.__wrap
    ) {
      applyImageLayout(dom, this.getLayout());
    }
    return false;
  }

  isInline(): boolean {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <EditorImage
        nodeKey={this.getKey()}
        src={this.__src}
        alt={this.__alt}
        layout={this.getLayout()}
      />
    );
  }
}

const ALIGNMENTS: ImageAlign[] = ["left", "center", "right"];

/**
 * The layout, as classes and styles on the wrapper.
 *
 * Written imperatively because this runs inside `createDOM`/`updateDOM`, which
 * are handed a real element rather than a chance to render JSX. The float
 * margins are asymmetric on purpose: the gap belongs between the picture and
 * the text flowing beside it, and putting it on both sides would indent the
 * picture from the edge it is aligned to.
 */
function applyImageLayout(dom: HTMLElement, layout: ImageLayout): void {
  const { width, align, wrap } = layout;
  const floating = wrap && align !== "center";

  dom.className = floating
    ? align === "left"
      ? "float-left mr-6 mb-3 max-w-full"
      : "float-right ml-6 mb-3 max-w-full"
    : [
        "my-5 max-w-full",
        align === "left" ? "mr-auto" : align === "right" ? "ml-auto" : "mx-auto",
      ].join(" ");

  dom.style.width = width === null ? "" : `${width}%`;
}

export function $createImageNode(
  src: string,
  alt: string,
  mediaId: number | null,
  layout?: ImageLayout,
): ImageNode {
  return new ImageNode(src, alt, mediaId, layout);
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
