/**
 * Scroll sentinels for the header transition.
 *
 * Rendered by any section that the header is allowed to sit transparently over.
 * The header watches these with IntersectionObserver rather than a scroll
 * listener — a handler firing every frame would cost us the sub-2s Core Web
 * Vitals target.
 *
 * Two sentinels of different heights give the 12px hysteresis band, so the bar
 * cannot flicker when a visitor rests on the threshold:
 *   - "on"  is 64px tall — once it leaves the viewport, the header pins.
 *   - "off" is 52px tall — once it re-enters, the header goes transparent again.
 *
 * A page with no sentinel keeps the header pinned from scroll 0. That is
 * deliberate: Contact, Careers, Procurement and the publication listings open
 * onto white, and a white lockup on a white page is the one failure this
 * pattern invites.
 */
export function HeroSentinels() {
  return (
    <>
      <div
        data-header-sentinel="on"
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-16"
      />
      <div
        data-header-sentinel="off"
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-13"
      />
    </>
  );
}
