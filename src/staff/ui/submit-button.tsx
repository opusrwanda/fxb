"use client";

import { useFormStatus } from "react-dom";

/**
 * A submit button that says when it has been pressed.
 *
 * Signing in sends an email before the next page can load, and that takes a
 * few seconds during which the form used to look exactly as it did before the
 * click. The natural reading of a button that did nothing is to press it
 * again, and every press was another code in the inbox.
 *
 * Disabled while the form is in flight, with the label changed so it reads as
 * work in progress rather than as a button that has broken. Without JavaScript
 * it is an ordinary submit button, which is what it was.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={className}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
