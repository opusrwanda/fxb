import type { Metadata } from "next";
import { Oswald, Poppins } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        <SiteHeader />
        <main id="main" className="lg:col-span-7 lg:col-start-6">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
