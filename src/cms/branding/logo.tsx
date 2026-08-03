/* eslint-disable @next/next/no-img-element */
/**
 * The lockup on the login screen and the top of the editor.
 *
 * A plain `img`, not `next/image`: Payload renders its own chrome outside the
 * site's tree, and the optimiser is not worth a request here for a logo that is
 * shown once at a fixed size.
 *
 * The colour lockup, because the editor is a white room.
 */
export function Logo() {
  return (
    <img
      src="/img/logo-colour.png"
      alt="FXB Rwanda"
      style={{ width: 200, height: "auto" }}
    />
  );
}
