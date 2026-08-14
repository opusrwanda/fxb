import Image from "next/image";
import Link from "next/link";
import type { JSX } from "react";

import type { RichText, RichTextNode } from "../db/schema";
import { videoEmbed } from "./video";

/**
 * Lexical's stored JSON, rendered as React.
 *
 * Lexical is Meta's editor and it stores a plain tree — a root with children,
 * each node carrying a `type` and, for text, a `format` bitmask. Walking that
 * is a hundred lines, which is why this is ours rather than a dependency: the
 * editing engine is genuinely hard and worth renting, but reading the tree it
 * produces is not.
 *
 * Anything unrecognised renders its children and drops itself. A tree written
 * by a newer editor than this renderer knows about should lose its formatting,
 * never its words.
 */

/** Lexical's text format bitmask. */
const BOLD = 1;
const ITALIC = 1 << 1;
const STRIKETHROUGH = 1 << 2;
const UNDERLINE = 1 << 3;
const CODE = 1 << 4;
const SUBSCRIPT = 1 << 5;
const SUPERSCRIPT = 1 << 6;

function renderText(node: RichTextNode, key: number): JSX.Element | string {
  const text = node.text ?? "";
  const format = typeof node.format === "number" ? node.format : 0;

  if (format === 0) return text;

  // Wrapped from the inside out, so bold italic nests rather than fighting.
  let element: JSX.Element = <>{text}</>;
  if (format & CODE) element = <code>{element}</code>;
  if (format & SUBSCRIPT) element = <sub>{element}</sub>;
  if (format & SUPERSCRIPT) element = <sup>{element}</sup>;
  if (format & STRIKETHROUGH) element = <s>{element}</s>;
  if (format & UNDERLINE) element = <u>{element}</u>;
  if (format & ITALIC) element = <em>{element}</em>;
  if (format & BOLD) element = <strong>{element}</strong>;

  return <span key={key}>{element}</span>;
}

/**
 * How a block sits in the measure.
 *
 * On an element node Lexical's `format` is a string naming the alignment — a
 * different thing entirely from `format` on a text node, which is the bitmask
 * above. Same property, two meanings, and reading one as the other is silent:
 * `"justify"` as a number is `NaN`, every bitwise test fails, and the text
 * renders unstyled rather than wrong. Which is exactly what happened here.
 *
 * THIS IS THE BUG FXB REPORTED. The editor is Lexical, and Lexical applies an
 * element's alignment to its own DOM without being asked. This renderer never
 * read the property at all, so a justified paragraph was justified in the
 * staff panel and ragged-right on the website — the same article, two shapes,
 * with no control anywhere to say which was meant.
 *
 * `start` and `end` are Lexical's writing-direction-aware alignments. The
 * toolbar does not offer them, but a document pasted from elsewhere can carry
 * them, and on a left-to-right site they mean left and right.
 */
function alignment(node: RichTextNode): string | undefined {
  switch (node.format) {
    case "center":
      return "text-center";
    case "right":
    case "end":
      return "text-right";
    case "justify":
      // `hyphens-auto` travels with it, and is not decoration. Justifying a
      // narrow column of English without hyphenation is what produces the
      // rivers of white space that make justified text look broken.
      return "text-justify hyphens-auto";
    case "left":
    case "start":
      return "text-left";
    default:
      // Unset, or a value from an editor newer than this renderer. Either way
      // the paragraph keeps the flow's own alignment rather than guessing.
      return undefined;
  }
}

function children(nodes: RichTextNode[] | undefined): React.ReactNode {
  if (!nodes?.length) return null;
  return nodes.map((node, index) => renderNode(node, index));
}

function renderNode(node: RichTextNode, key: number): React.ReactNode {
  switch (node.type) {
    case "text":
      return renderText(node, key);

    case "linebreak":
      return <br key={key} />;

    case "paragraph": {
      // Lexical emits an empty paragraph for a blank line. Rendering it would
      // put a stray gap in the flow, so it is dropped.
      if (!node.children?.length) return null;
      return (
        <p key={key} className={alignment(node)}>
          {children(node.children)}
        </p>
      );
    }

    case "heading": {
      const tag = (node.tag as string) ?? "h2";
      const Heading = tag as keyof JSX.IntrinsicElements;
      return (
        <Heading key={key} className={alignment(node)}>
          {children(node.children)}
        </Heading>
      );
    }

    case "quote":
      return (
        <blockquote key={key} className={alignment(node)}>
          {children(node.children)}
        </blockquote>
      );

    case "list": {
      const List = node.listType === "number" ? "ol" : "ul";
      return <List key={key}>{children(node.children)}</List>;
    }

    case "listitem":
      return (
        <li key={key} className={alignment(node)}>
          {children(node.children)}
        </li>
      );

    case "horizontalrule":
      return <hr key={key} />;

    /**
     * A picture placed in the article body.
     *
     * `next/image` with `fill` is not usable here: the intrinsic size is not
     * in the stored node, and a picture in a body of text has no fixed box to
     * fill. `width`/`height` at a nominal 1600×900 with `h-auto` in `Prose`
     * gives the browser something to reserve and then lets the real aspect
     * ratio take over, which is enough to stop the paragraph below it jumping
     * when the file arrives.
     *
     * The description is whatever the library holds. Empty is rendered as
     * empty — an `alt=""` marks a picture as decorative, which is wrong here
     * but is at least silent, where inventing a description would be worse.
     */
    case "image": {
      const src = typeof node.src === "string" ? node.src : "";
      if (!src) return null;
      const alt = typeof node.alt === "string" ? node.alt : "";

      /**
       * How it was placed, if anybody placed it.
       *
       * Every one of these is absent from an article written before the panel
       * offered the controls, so each falls back to what those articles have
       * always rendered as: full width, centred, no wrapping. Read defensively
       * — this is JSON from a database column, and a node written by a future
       * editor is not required to agree with this renderer.
       */
      const align =
        node.align === "left" || node.align === "right" ? node.align : "center";
      const width =
        typeof node.width === "number" && node.width > 0
          ? Math.min(100, Math.round(node.width))
          : null;
      // Centred and wrapped is not a thing — there is no side for the text to
      // run down — so the pair is resolved here rather than trusted.
      const wrap = node.wrap === true && align !== "center";

      return (
        <figure
          key={key}
          data-align={align}
          data-wrap={wrap ? "true" : undefined}
          // A custom property rather than `width`, so the stylesheet can
          // ignore it below `sm` where nothing floats. See globals.css.
          style={width === null ? undefined : ({ "--figure-width": `${width}%` } as React.CSSProperties)}
        >
          <Image
            src={src}
            alt={alt}
            width={1600}
            height={900}
            /**
             * What slot the browser should assume when picking a file.
             *
             * `100vw` for a full-width picture: the prose column is close to
             * the full viewport on the phones that pay for the bytes, and a
             * `ch` value is not something Next can resolve — it picked the
             * 640px candidate for a slot 1120px wide and the photograph
             * arrived visibly soft.
             *
             * A placed picture narrows on desktop and still fills the width on
             * a phone, which is exactly what the media query says, so the hint
             * says the same thing rather than over-fetching a picture that is
             * a third of a column.
             */
            sizes={width === null ? "100vw" : `(min-width: 640px) ${width}vw, 100vw`}
          />
          {alt && <figcaption>{alt}</figcaption>}
        </figure>
      );
    }

    /**
     * A video, by provider.
     *
     * Which address each provider embeds at, and what shape its frame is, is
     * `lexical/video.ts` — the same file the panel reads a pasted link with,
     * so the two cannot disagree about what is supported.
     *
     * Every embed is lazy-loaded. An embed is a whole second browser, and an
     * article with three of them would otherwise load three of them before the
     * words.
     *
     * They are not sandboxed, deliberately rather than by omission. A `sandbox`
     * tight enough to be worth having breaks these players in ways that differ
     * per provider, and a half-open one is a comment claiming a protection
     * that is not there. What limits them is the `allow` list and the fact
     * that nothing on this site is authenticated for a reader — there is no
     * session for a frame to reach.
     *
     * A `file` is served with controls and no autoplay. Video that starts by
     * itself in the middle of an article is a thing done to a reader, not for
     * them.
     */
    case "video": {
      const provider = node.provider as string;
      const videoId = typeof node.videoId === "string" ? node.videoId : "";
      if (!videoId) return null;
      const title = (typeof node.title === "string" && node.title) || "Video";

      if (provider === "file") {
        return (
          <video key={key} src={videoId} controls playsInline preload="metadata" title={title} />
        );
      }

      const frame = videoEmbed(provider, videoId);
      // A provider this renderer does not know, or an id that no longer looks
      // like one. Nothing is better than an empty box with a border.
      if (!frame) return null;

      return (
        <div key={key} className={`${frame.aspect} w-full ${frame.width ?? ""}`}>
          <iframe
            src={frame.src}
            title={title}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="size-full rounded-card border-0"
          />
        </div>
      );
    }

    case "link":
    case "autolink": {
      const fields = (node.fields ?? {}) as { url?: string; newTab?: boolean };
      const url = fields.url ?? (node.url as string) ?? "#";
      const external = /^https?:\/\//.test(url);

      // An internal link goes through next/link so it navigates without a full
      // page load; an external one is a plain anchor and says so to a screen
      // reader when it opens a new tab.
      if (external) {
        return (
          <a
            key={key}
            href={url}
            {...(fields.newTab
              ? { target: "_blank", rel: "noreferrer noopener" }
              : {})}
          >
            {children(node.children)}
            {fields.newTab && <span className="sr-only"> (opens in a new tab)</span>}
          </a>
        );
      }

      return (
        <Link key={key} href={url}>
          {children(node.children)}
        </Link>
      );
    }

    default:
      // Unknown node: keep the words, lose the wrapper.
      return node.children?.length ? (
        <span key={key}>{children(node.children)}</span>
      ) : null;
  }
}

export function RenderRichText({ data }: { data: RichText | null | undefined }) {
  if (!data?.root?.children?.length) return null;
  return <>{children(data.root.children)}</>;
}
