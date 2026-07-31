"use client";

import { Plus } from "lucide-react";
import { useId, useState } from "react";

/**
 * Titles that open in place.
 *
 * The brief asks for this twice — for the three guiding principles and for the
 * pillars — with the same note both times: "only displaying titles, and content
 * be shown when clicked without opening another page", referencing Acumen's
 * impact sectors. So the resting state is a list of headings and nothing else,
 * and the detail arrives underneath the heading that was asked for.
 *
 * One open at a time. With several panels open the list stops being scannable,
 * which is the only reason to collapse it in the first place.
 *
 * The panel is always in the DOM, collapsed with a grid row rather than
 * `display: none`, so the height animates and in-page search still finds the
 * text. `hidden` would break both; a max-height guess would clip long panels.
 *
 * `variant` only changes the colours: the same component runs on white and
 * inside a blue room.
 */
export type AccordionItem = {
  id: string;
  title: string;
  /** Rendered on the server and handed over as a prop. */
  content: React.ReactNode;
};

/**
 * Colours per ground.
 *
 * Closed titles are NOT dimmed. Fading them is the obvious way to make the open
 * one stand out, but at 40% white on blue a closed title lands around 2:1 —
 * half the contrast a heading needs — and the same trick on white is no better.
 * State is carried by the icon and the panel instead, and every title stays at
 * full strength whether it is open or not.
 *
 * The icon is the state indicator, so it is held above 3:1 in both grounds
 * too. Only the ring around it is decoration.
 */
const palettes = {
  light: {
    border: "border-gray-15",
    title: "text-blue",
    icon: "text-gray",
    iconOpen: "text-blue",
    ring: "border-gray-15 group-hover:border-blue",
  },
  dark: {
    border: "border-white-12",
    title: "text-white",
    icon: "text-white-70",
    iconOpen: "text-white",
    ring: "border-white-40 group-hover:border-white",
  },
} as const;

export function Accordion({
  items,
  variant = "light",
  /** Opens on first render. Defaults to the first item so the block is never bare. */
  defaultOpen,
}: {
  items: AccordionItem[];
  variant?: keyof typeof palettes;
  defaultOpen?: string | null;
}) {
  const [open, setOpen] = useState<string | null>(
    defaultOpen === undefined ? (items[0]?.id ?? null) : defaultOpen
  );
  const prefix = useId();
  const palette = palettes[variant];

  return (
    <ul>
      {items.map((item) => {
        const isOpen = item.id === open;
        const panelId = `${prefix}-${item.id}`;

        return (
          <li key={item.id} className={`border-t ${palette.border} last:border-b`}>
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="group flex w-full items-center justify-between gap-6 py-7 text-left"
              >
                <span
                  className={`text-xl leading-snug font-semibold tracking-[-0.02em] lg:text-[26px] ${palette.title}`}
                >
                  {item.title}
                </span>
                <span
                  className={`motion-transform flex size-10 shrink-0 items-center justify-center rounded-full border transition-[transform,color,border-color] duration-[280ms] ease-out ${
                    palette.ring
                  } ${isOpen ? `rotate-45 ${palette.iconOpen}` : palette.icon}`}
                  aria-hidden="true"
                >
                  <Plus className="size-5" />
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              className={`motion-size grid transition-[grid-template-rows] duration-[320ms] ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                {/* The padding lives here rather than on the row, so a
                    collapsed panel really does measure zero. */}
                <div className="pb-9">{item.content}</div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
