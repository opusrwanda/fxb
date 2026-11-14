import { getSiteDetails } from "@/cms/content/settings";

/**
 * The logo over the sign-in pages: whichever one the site is using now.
 *
 * These pages drew `public/img/logo-colour.png`, the file the site shipped
 * with, while the website itself had moved to the lockup uploaded in Site
 * details — so the first thing a colleague saw on the way in was the logo FXB
 * had replaced. Same source as the public header now, and the shipped file
 * only where nobody has uploaded one.
 */
export async function StaffLogo() {
  const { logos } = await getSiteDetails();

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logos.colour?.url ?? "/img/logo-colour.png"}
      alt="FXB Rwanda"
      className="mb-10 h-12 w-auto"
    />
  );
}
