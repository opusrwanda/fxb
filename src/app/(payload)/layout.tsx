/* THIS FILE IS PART OF PAYLOAD'S OWN ROUTE GROUP.
 *
 * The `(payload)` group is deliberately outside the site's own layout: the
 * editor must not inherit the FXB header, footer, fonts or Tailwind reset, and
 * the site must not load the editor's stylesheet. Route groups are how Next
 * gives two parts of one app two different roots.
 */
import type { ServerFunctionClient } from "payload";
import config from "@payload-config";
import { RootLayout, handleServerFunctions } from "@payloadcms/next/layouts";
import { importMap } from "./staff/importMap";
import "@payloadcms/next/css";

const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  return handleServerFunctions({ ...args, config, importMap });
};

export default function PayloadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}
