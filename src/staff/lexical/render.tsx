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
