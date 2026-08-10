import Image from "next/image";
import Link from "next/link";
import type { JSX } from "react";

import type { RichText, RichTextNode } from "../db/schema";

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
      return <p key={key}>{children(node.children)}</p>;
    }

    case "heading": {
      const tag = (node.tag as string) ?? "h2";
      const Heading = tag as keyof JSX.IntrinsicElements;
      return <Heading key={key}>{children(node.children)}</Heading>;
    }

    case "quote":
      return <blockquote key={key}>{children(node.children)}</blockquote>;

    case "list": {
      const List = node.listType === "number" ? "ol" : "ul";
      return <List key={key}>{children(node.children)}</List>;
    }

    case "listitem":
      return <li key={key}>{children(node.children)}</li>;

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

      return (
        <figure key={key}>
          <Image
            src={src}
            alt={alt}
            width={1600}
            height={900}
            // `100vw`, deliberately, even though the column is narrower than
            // the viewport. A `ch` value here is not a width Next can resolve
            // — it picked the 640px candidate for a slot 1120px wide, and the
            // photograph arrived visibly soft. Over-fetching a step is the
            // cheaper mistake, and the prose column is close to full width on
            // the phones that pay for it.
            sizes="100vw"
          />
          {alt && <figcaption>{alt}</figcaption>}
        </figure>
      );
    }

    /**
     * A video, by provider.
     *
     * The embeds are the privacy-preserving hosts — `youtube-nocookie.com` and
     * Vimeo's `dnt=1` — because an article on this site should not be setting
     * advertising cookies on a reader who came to read about a school. Both
     * are lazy-loaded: an embed is a whole second browser, and an article with
     * three of them would otherwise load three of them before the words.
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

      const embed =
        provider === "vimeo"
          ? `https://player.vimeo.com/video/${encodeURIComponent(videoId)}?dnt=1`
          : `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;

      return (
        <div key={key} className="aspect-video w-full">
          <iframe
            src={embed}
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
