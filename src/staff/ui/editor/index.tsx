"use client";

import { useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import type { EditorState } from "lexical";

import { ImageNode, VideoNode } from "./nodes";
import { Toolbar } from "./toolbar";

/**
 * The rich text editor.
 *
 * Lexical, which is Meta's — the editing engine is the one part of a CMS worth
 * renting, because contenteditable, selection, undo and paste sanitisation are
 * specialist work measured in years. Payload made the same call. Everything
 * around it is ours.
 *
 * HOW IT REACHES THE SERVER
 *
 * The document form is a plain form posting to a server action, which is what
 * lets the panel save without JavaScript. The editor keeps that arrangement
 * intact by writing its state into a hidden input on every change, so the form
 * posts the Lexical JSON as an ordinary field. Nothing about the save path
 * knows an editor is involved.
 *
 * The class names on each node come from `theme` below and deliberately match
 * `Prose`, the component that renders this same content on the website. What
 * the writer sees is what the reader gets, which is the entire point of the
 * exercise.
 */

const theme = {
  paragraph: "mb-4 text-base leading-relaxed text-gray",
  heading: {
    h2: "mt-6 mb-3 text-2xl font-bold tracking-[-0.02em] text-blue",
    h3: "mt-4 mb-2 text-xl font-bold tracking-[-0.01em] text-blue",
  },
  // Body colour, not blue. Quoting a passage was recolouring it, which reads
  // as the text having been changed rather than set apart — the rule down the
  // left, the size and the light weight already say "this is a quotation", and
  // they say it without touching the words. Matches `Prose`.
  quote:
    "my-4 border-l-2 border-blue pl-6 text-lg leading-relaxed text-gray",
  list: {
    ul: "mb-4 list-disc pl-6",
    ol: "mb-4 list-decimal pl-6",
    listitem: "mt-2 text-base leading-relaxed text-gray",
  },
  link: "font-semibold text-blue underline underline-offset-4",
  text: {
    bold: "font-semibold text-blue",
    italic: "italic",
    underline: "underline underline-offset-2",
    strikethrough: "line-through",
  },
};

export function RichTextEditor({
  name,
  initialJson,
  ariaLabelledBy,
}: {
  /** The form field the JSON is posted under. */
  name: string;
  /** The stored Lexical document, as JSON. Empty for a new document. */
  initialJson: string;
  ariaLabelledBy?: string;
}) {
  const [value, setValue] = useState(initialJson);

  return (
    <div className="overflow-hidden rounded-card border border-gray-15 bg-white focus-within:border-blue">
      <LexicalComposer
        initialConfig={{
          namespace: "fxb",
          theme,
          // ImageNode and VideoNode are ours — see `nodes.tsx`. A node type
          // that is not registered here throws when a stored document
          // containing it is loaded, so this list and `lexical/render.tsx`
          // have to move together.
          nodes: [
            HeadingNode,
            QuoteNode,
            ListNode,
            ListItemNode,
            LinkNode,
            AutoLinkNode,
            ImageNode,
            VideoNode,
          ],
          // A stored document is handed to Lexical as its starting state. An
          // empty string means a new document, and Lexical starts blank.
          editorState: initialJson && initialJson !== "" ? initialJson : undefined,
          onError(error) {
            // Never swallow it — a broken editor that looks fine is worse than
            // one that says so.
            console.error("[editor]", error);
          },
        }}
      >
        <Toolbar />

        <RichTextPlugin
          contentEditable={
            <ContentEditable
              aria-labelledby={ariaLabelledBy}
              className="min-h-[24rem] px-5 py-4 outline-none"
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />

        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />

        <OnChangePlugin
          ignoreSelectionChange
          onChange={(editorState: EditorState) =>
            setValue(JSON.stringify(editorState.toJSON()))
          }
        />
      </LexicalComposer>

      {/* What the form actually posts. */}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
