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

import { ImageDragPlugin } from "./image-drag-plugin";
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

/**
 * The editor's typography, which is `Prose`'s.
 *
 * Every value here is the one the website renders with, and that is the whole
 * job of this object — the claim in the comment above is only true if these
 * two stay in step.
 *
 * THE 62ch MEASURE IS THE IMPORTANT ONE. It was missing, so the editor set
 * paragraphs across the full width of its box while the site holds them to 62
 * characters. The words were identical and the lines broke in different
 * places, which is invisible on ragged-right text and glaring the moment
 * something is justified: the panel showed even columns and the website showed
 * the same paragraph with different gaps in it. The type size had the same
 * problem — 16px here against 17px on a large screen there.
 */
const theme = {
  paragraph: "mb-6 max-w-[62ch] text-base leading-relaxed text-gray lg:text-[17px]",
  heading: {
    h2: "mt-6 mb-3 text-2xl font-bold tracking-[-0.02em] text-blue",
    h3: "mt-4 mb-2 text-xl font-bold tracking-[-0.01em] text-blue",
  },
  // Body colour, not blue. Quoting a passage was recolouring it, which reads
  // as the text having been changed rather than set apart — the rule down the
  // left, the size and the light weight already say "this is a quotation", and
  // they say it without touching the words. Matches `Prose`.
  quote:
    "my-6 border-l-2 border-blue pl-6 text-[26px] leading-[1.45] font-extralight tracking-[-0.01em] text-gray",
  list: {
    ul: "mb-6 max-w-[62ch] list-disc pl-6",
    ol: "mb-6 max-w-[62ch] list-decimal pl-6",
    listitem: "mt-2 text-base leading-relaxed text-gray lg:text-[17px]",
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
  readOnly = false,
}: {
  /** The form field the JSON is posted under. */
  name: string;
  /** The stored Lexical document, as JSON. Empty for a new document. */
  initialJson: string;
  ariaLabelledBy?: string;
  /**
   * Show the document without offering to change it.
   *
   * For somebody whose role lets them read this collection and not write to
   * it. `disabled` on the surrounding fieldset takes care of every other
   * control on the page, because they are ordinary form elements and the
   * browser knows what disabling one means. A Lexical editor is a `div` with
   * `contenteditable` on it, so the browser does not: without this, a person
   * with read access could type into a body they have no way to save.
   */
  readOnly?: boolean;
}) {
  const [value, setValue] = useState(initialJson);

  return (
    <div className="overflow-hidden rounded-card border border-gray-15 bg-white focus-within:border-blue">
      <LexicalComposer
        initialConfig={{
          namespace: "fxb",
          theme,
          editable: !readOnly,
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
        {!readOnly && <Toolbar />}

        <RichTextPlugin
          contentEditable={
            <ContentEditable
              aria-labelledby={ariaLabelledBy}
              // The resize maths measures against this element: a width
              // dragged in pixels is stored as a percentage of the column the
              // picture actually sits in, not of the window.
              data-editor-content=""
              className="min-h-[24rem] px-5 py-4 outline-none"
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />

        {/* Where a dragged picture lands. The drag itself starts on the
            image; this is the half that knows the document. */}
        <ImageDragPlugin />

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
