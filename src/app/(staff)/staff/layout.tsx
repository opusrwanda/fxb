import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import "../../(site)/globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Staff", template: "%s — FXB Rwanda Staff" },
  // The panel is not for search engines, and a CMS turning up in results is a
  // small invitation to go looking for its login form.
  robots: { index: false, follow: false },
};

/**
 * The document the panel lives in.
 *
 * Deliberately only the document. The session check is one level down, in
 * `(panel)/layout.tsx`, because the login page is inside `/staff` too and a
 * check here would redirect it to itself forever.
 *
 * It borrows the site's stylesheet, so the colour tokens, the type and the
 * focus ring are the same ones the website uses rather than a second set that
 * drifts.
 */
export default function StaffDocument({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} h-full`}>
      <body className="min-h-full bg-white text-gray antialiased">{children}</body>
    </html>
  );
}
