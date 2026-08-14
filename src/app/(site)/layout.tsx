import type { Metadata } from "next";
import { Oswald, Poppins } from "next/font/google";
import "./globals.css";
import { getLatestAnnualReport } from "@/cms/content/publications";
import { getSiteDetails } from "@/cms/content/settings";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PromoBanner } from "@/components/layout/promo-banner";
import { PageViewBeacon } from "@/components/layout/page-view-beacon";
import { getPromoBanner } from "@/cms/content/banner";

/**
 * Poppins, in the five weights the brand sheet names.
 *
 * ExtraLight and Light are here for display sizes only. A geometric sans at
 * 200 is elegant at 32px and unreadable at 15px, and this audience reads on
 * mid-range Android screens in daylight — so the rule that goes with loading
 * them is that they are never used below about 24px, and never on a colour
 * ground where the contrast is already working hard. Body copy stays at 400.
 *
 * Each weight is a separate file, so this is two more requests than before.
 * They are subset to latin and swapped in, and only the display sizes wait on
 * them.
 */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  display: "swap",
});

/**
 * Display face for statistics only.
 *
 * The Brand Guiding Tool specifies Poppins, which has no condensed cut — and a
 * geometric sans set very large reads wide and soft, not tall and urgent. This
 * is scoped to impact numerals and nothing else: no headings, no body, no UI.
 */
const oswald = Oswald({
  variable: "--font-display-family",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fxbrwanda.org"),
  title: {
    default: "FXB Rwanda — Creating a world fit for children",
    template: "%s | FXB Rwanda",
  },
  description:
    "FXB Rwanda empowers vulnerable children, families and communities through integrated interventions in education, health, nutrition, economic empowerment, child protection, HIV prevention, WASH and climate resilience.",
  openGraph: {
    type: "website",
    locale: "en_RW",
    siteName: "FXB Rwanda",
    url: "https://fxbrwanda.org",
  },
};

/**
 * The header and footer are the two things on every page that read from the
 * CMS, and both are client components — the header for its scroll states, the
 * footer for nothing at all but it shares the nav. So the asking happens here,
 * once per page, and the answers go down as props.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [details, report, banner] = await Promise.all([
    getSiteDetails(),
    getLatestAnnualReport(),
    getPromoBanner(),
  ]);

  return (
    <html
      lang="en"
      className={`${poppins.variable} ${oswald.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-white text-gray antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-full focus:bg-white focus:px-6 focus:py-3 focus:font-semibold focus:text-blue"
        >
          Skip to content
        </a>
        {/* Above the header, and pinned there. Renders nothing unless a
            campaign is switched on and this is the home page. */}
        <PromoBanner banner={banner} />

        <SiteHeader
          details={details}
          report={report && { title: report.title, slug: report.slug }}
          hasPromo={banner !== null}
          promoHeight={banner?.height}
        />
        <main id="main" className="lg:col-span-7 lg:col-start-6">
          {children}
        </main>
        <SiteFooter details={details} />

        {/* Renders nothing. Reports which page was opened, with no cookie and
            no address kept — see `page-view-beacon.tsx`. Last in the body so
            it cannot delay anything a reader is waiting for. */}
        <PageViewBeacon />
      </body>
    </html>
  );
}
