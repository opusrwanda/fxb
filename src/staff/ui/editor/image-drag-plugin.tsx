"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getRoot,
  COMMAND_PRIORITY_HIGH,
  DRAGOVER_COMMAND,
  DROP_COMMAND,
  type LexicalNode,
} from "lexical";

import { $isImageNode } from "./nodes";

/**
 * Dragging a picture to somewhere else in the article.
 *
 * The image itself starts the drag — see `EditorImage`, which puts the node's
 * key on the dataTransfer. This is the other half: where it lands.
 *
 * A drop is a pair of screen coordinates, and turning those into a place in
 * the document is the whole problem. The block under the pointer is found from
 * the element the browser reports at that point, and the picture goes above or
 * below it depending on which half of it was dropped on — which is the
 * behaviour people already expect from dragging anything into a list.
 *
 * WHY NOT THE BROWSER'S OWN DROP. Left alone, a `contenteditable` handles an
 * internal drag by moving the DOM directly, behind Lexical's back. The editor
 * state then disagrees with the DOM: the picture appears to move and reverts
 * on the next keystroke, or the node is duplicated. So both commands return
 * `true` — the drag is ours, and the browser is told to keep out of it.
 */
export function ImageDragPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    /** Is this drag one of ours? */
    const carriesImage = (event: DragEvent) =>
      event.dataTransfer?.types.includes("application/x-fxb-image") ?? false;

    return mergeRegister(
      editor.registerCommand<DragEvent>(
        DRAGOVER_COMMAND,
        (event) => {
          if (!carriesImage(event)) return false;
          // Without `preventDefault` the browser refuses the drop entirely —
          // an element is not a drop target until something says it is.
          event.preventDefault();
          if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),

      editor.registerCommand<DragEvent>(
        DROP_COMMAND,
        (event) => {
          if (!carriesImage(event)) return false;

          const key = event.dataTransfer?.getData("application/x-fxb-image");
          if (!key) return false;

          event.preventDefault();

          editor.update(() => {
            const node = $getNodeByKey(key);
            if (!$isImageNode(node)) return;

            const target = blockAt(event.clientX, event.clientY);

            // Dropped on empty space below the last paragraph, or onto itself
            // — in the second case there is nothing to do, and moving a node
            // relative to itself detaches it.
            if (!target || target.getKey() === node.getKey()) return;

            const box = editor.getElementByKey(target.getKey())?.getBoundingClientRect();
            const below = box ? event.clientY > box.top + box.height / 2 : true;

            if (below) target.insertAfter(node);
            else target.insertBefore(node);
          });

          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
    );

    /**
     * The top-level block under a point.
     *
     * `elementFromPoint` gives whatever is nearest — a `<strong>` inside a
     * paragraph, say — so the node it maps to is walked up to the child of the
     * root. A picture is a block and can only sit between blocks; inserting it
     * beside a run of bold text inside a sentence would split the paragraph.
     */
    function blockAt(x: number, y: number): LexicalNode | null {
      const element = document.elementFromPoint(x, y);
      if (!element) return null;

      const node = $getNearestNodeFromDOMNode(element);
      if (!node) return null;

      const root = $getRoot();
      let candidate: LexicalNode | null = node;

      while (candidate && candidate.getParent() !== null) {
        if (candidate.getParent()?.getKey() === root.getKey()) return candidate;
        candidate = candidate.getParent();
      }

      return null;
    }
  }, [editor]);

  return null;
}
