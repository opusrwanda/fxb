"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

/**
 * A password field you can read back.
 *
 * Typing a long password blind is how people get locked out, and the usual
 * answer — a second "confirm password" box — only doubles the guessing. The eye
 * is the honest version: it is the person's own screen, and they are the one
 * who decides whether anybody can see it.
 *
 * Three details that are easy to get wrong:
 *
 *   `type="button"`, because a bare button inside a form submits it. Without
 *   this, revealing the password would attempt to sign in with whatever was
 *   typed so far.
 *
 *   The label changes with the state — "Show password" when hidden, "Hide
 *   password" when visible — so a screen reader announces what pressing it will
 *   do rather than what the icon looks like. `aria-pressed` carries the state
 *   itself, so it is announced as a toggle rather than as two different
 *   buttons.
 *
 *   It starts hidden and never remembers otherwise. A field that reopens
 *   revealed because it was revealed last time is a surprise on a shared
 *   screen.
 */
export function PasswordField({
  label = "Password",
  name = "password",
  autoComplete = "current-password",
  required,
}: {
  label?: string;
  name?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-blue">
        {label}
      </label>

      {/* `relative` is what the button below is positioned against. */}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          // Room on the right for the button, so a long password never runs
          // underneath it.
          className="h-12 w-full rounded-card border border-gray-15 bg-white pr-12 pl-4 text-base text-gray transition-colors duration-200 outline-none focus:border-blue"
        />

        <button
          type="button"
          onClick={() => setVisible((shown) => !shown)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-card text-gray-80 transition-colors duration-200 hover:text-blue"
        >
          {visible ? (
            <EyeOff className="size-5" aria-hidden="true" />
          ) : (
            <Eye className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
