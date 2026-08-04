import { redirect } from "next/navigation";

import { currentUser } from "@/staff/auth/session";
import { StaffNav } from "@/staff/ui/nav";

/**
 * Everything behind the sign-in.
 *
 * The check is in a layout rather than in each page because a page can forget
 * and a layout cannot be bypassed — every route in this group is covered by
 * construction, including ones added later by somebody who has never read this
 * comment.
 */
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/staff/login");

  return (
    <>
      <a
        href="#staff-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-full focus:bg-white focus:px-6 focus:py-3 focus:font-semibold focus:text-blue"
      >
        Skip to content
      </a>

      <div className="flex min-h-svh">
        <aside className="sticky top-0 hidden h-svh w-64 shrink-0 lg:block">
          <StaffNav user={user} />
        </aside>

        <main id="staff-main" className="min-w-0 flex-1 px-6 py-8 lg:px-12 lg:py-12">
          {children}
        </main>
      </div>
    </>
  );
}
