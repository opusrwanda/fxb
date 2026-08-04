/**
 * One date format for the whole site.
 *
 * Fixed to en-GB and UTC on purpose. Payload stores dates as timestamps, and
 * formatting one in the server's zone and again in the reader's produces two
 * different days either side of midnight — which React reports as a hydration
 * mismatch, and a reader would see as the wrong publication date.
 */
const formatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDate(value: string): string {
  return formatter.format(new Date(value));
}

/** The `datetime` attribute for a `<time>` element: `2025-07-09`. */
export function isoDate(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}
