"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Trash2, X } from "lucide-react";

/**
 * Asking before something irreversible.
 *
 * Ours, not the browser's. `window.confirm` is styled by the browser, cannot
 * say more than one line, names the site rather than the thing being deleted,
 * and blocks the whole tab while it is open — and on top of all that it looks
 * like the phishing prompts people are trained to dismiss without reading. A
 * dialog that gets dismissed without reading is not a safeguard.
 *
 * So this one says what will be deleted by name, says plainly that it cannot
 * be undone, and puts Cancel where the eye lands first.
 *
 * NO RED. The palette is four values and none of them is a danger colour, and
 * inventing one here would put a fifth on the site by the back door. The
 * weight is carried by the words, by the deliberate second step, and by the
 * trigger being a quiet link rather than a button competing with Save — which
 * is the same way the rest of the panel handles consequence.
 *
 * The confirm sits in its own `<form>` around a server action, so the delete
 * still happens on the server and still works exactly as a form post. This is
 * a client component only because a dialog has open and closed states.
 */
export function ConfirmDialog({
  action,
  triggerLabel,
  title,
  body,
  confirmLabel,
}: {
  /** The server action to run on confirm. */
  action: () => Promise<void>;
  triggerLabel: string;
  title: string;
  body: string;
  confirmLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    // Cancel takes focus, not the destructive button. A dialog that opens with
    // Delete focused turns a stray Enter — from the keypress that opened it —
    // into the deletion it was supposed to prevent.
    cancelRef.current?.focus();

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !working) setOpen(false);
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, working]);

  const close = () => {
    if (working) return;
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <>
      <button
        ref={triggerRef}
        // Never a submit button: this sits on a page with the document form on
        // it, and a bare button inside a form submits it.
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray underline underline-offset-4 transition-colors duration-300 hover:text-blue"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-100 flex items-end justify-center bg-gray/50 p-0 sm:items-center sm:p-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-body"
            className="flex w-full max-w-lg flex-col rounded-t-card bg-white sm:rounded-card"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-15 p-5">
              <h2
                id="confirm-title"
                className="text-xl font-bold tracking-[-0.02em] text-blue"
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={close}
                disabled={working}
                aria-label="Close"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-gray transition-colors duration-300 hover:bg-blue-08 hover:text-blue disabled:opacity-40"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <p
              id="confirm-body"
              className="p-5 text-[15px] leading-relaxed text-gray"
            >
              {body}
            </p>

            <div className="flex items-center justify-end gap-4 border-t border-gray-15 p-5">
              <button
                ref={cancelRef}
                type="button"
                onClick={close}
                disabled={working}
                className="text-sm font-semibold text-gray underline underline-offset-4 transition-colors duration-300 hover:text-blue disabled:opacity-40"
              >
                Cancel
              </button>

              {/* A real form around a real server action, so this posts and
                  navigates the way every other write in the panel does. */}
              <form action={action} onSubmit={() => setWorking(true)}>
                <button
                  type="submit"
                  disabled={working}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-blue px-6 text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-blue-90 disabled:opacity-60"
                >
                  {working && (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  )}
                  {working ? "Deleting…" : confirmLabel}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
