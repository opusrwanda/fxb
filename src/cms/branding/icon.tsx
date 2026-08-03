/* eslint-disable @next/next/no-img-element */
/**
 * The small mark in the editor's top-left corner, next to the breadcrumbs.
 *
 * Served from `public/`, not from the App Router's generated `/icon.png` — that
 * route only answers on the hashed URL Next puts in the page's own link tag, so
 * a bare reference to it renders as a broken image.
 */
export function Icon() {
  return (
    <img
      src="/img/mark.png"
      alt="FXB Rwanda"
      style={{ width: 28, height: 28, borderRadius: 6 }}
    />
  );
}
