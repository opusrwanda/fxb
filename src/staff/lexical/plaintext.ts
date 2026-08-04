import type { RichText, RichTextNode } from "../db/schema";

/**
 * The words out of a Lexical tree, with the formatting dropped.
 *
 * Used for comparisons and for meta descriptions — anywhere the text matters
 * and the markup does not. Block-level nodes are separated by a newline so two
 * paragraphs do not run into one another as a single word.
 */
const BLOCKS = new Set([
  "paragraph",
  "heading",
  "quote",
  "listitem",
  "horizontalrule",
]);

function walk(nodes: RichTextNode[] | undefined, out: string[]): void {
  if (!nodes) return;

  for (const node of nodes) {
    if (node.type === "text") {
      out.push(node.text ?? "");
      continue;
    }
    if (node.type === "linebreak") {
      out.push("\n");
      continue;
    }

    walk(node.children, out);
    if (BLOCKS.has(node.type)) out.push("\n");
  }
}

export function plainText(data: RichText | null | undefined): string {
  if (!data?.root?.children) return "";
  const out: string[] = [];
  walk(data.root.children, out);
  return out.join("").replace(/\n{2,}/g, "\n").trim();
}
