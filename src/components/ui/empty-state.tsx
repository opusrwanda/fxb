import { Container } from "@/components/layout/container";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";

/**
 * The "nothing here yet" panel.
 *
 * Careers, Procurement, Publications and Newsletters all reach this state, and
 * the brief writes real copy for it in every case — an empty vacancies page is
 * a page with something to say, not a failure. So this is a proper panel with a
 * heading, an explanation and somewhere to go next, not a grey line of italics.
 *
 * The tinted wedge is the same one the phased-out projects page uses, so the
 * state reads consistently wherever it turns up.
 */
export function EmptyState({
  title,
  body,
  note,
  actions = [],
}: {
  title: string;
  body: string;
  /** The one-line version the brief supplies, e.g. "Please check back soon." */
  note?: string;
  actions?: { label: string; href: string; primary?: boolean }[];
}) {
  return (
    <Container>
      <Reveal className="wedge flex flex-col items-start gap-6 bg-blue-08 p-9 lg:p-14">
        <h2 className="max-w-[24ch] text-2xl font-bold tracking-[-0.02em] text-blue lg:text-[32px] lg:leading-[1.2]">
          {title}
        </h2>

        <p className="max-w-[64ch] text-base leading-relaxed text-gray lg:text-[17px]">
          {body}
        </p>

        {note && (
          <p className="text-base font-medium text-blue lg:text-[17px]">
            {note}
          </p>
        )}

        {actions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-4">
            {actions.map((action) => (
              <Pill
                key={action.href}
                href={action.href}
                size="lg"
                variant={action.primary ? "primary" : "outline"}
              >
                {action.label}
              </Pill>
            ))}
          </div>
        )}
      </Reveal>
    </Container>
  );
}
