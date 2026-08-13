"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, UserRound } from "lucide-react";

import { collections, globals, GROUPS, mailing, registers } from "../collections";
import { canSee } from "../auth/permissions";
import type { StaffUser } from "../auth/session";

/**
 * The sidebar.
 *
 * A blue room, which is the site's own device for a navigational surface — the
 * header at rest, the footer, the What We Do band. The team should not feel
 * they are crossing a visual border every time they move between the website
 * and the thing that edits it.
 *
 * Group headings take the site's eyebrow treatment: tracked capitals, quiet.
 * The current item takes the green marker the site uses for "you are here" in
 * the header and in both sticky navigation bars, so the signal means one thing
 * across both.
 *
 * Dashboard is a link in the list rather than something hidden behind the logo.
 * A logo that happens to be a link is a convention people who build admin
 * panels know and people who use them do not.
 */
export function StaffNav({ user }: { user: StaffUser }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/staff" ? pathname === "/staff" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Staff panel"
      className="flex h-full w-full flex-col gap-8 overflow-y-auto bg-blue px-5 py-7"
    >
      <Link
        href="/staff"
        className="flex items-center gap-3 px-1"
        aria-label="FXB Rwanda staff panel — dashboard"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/logo-white.png" alt="" className="h-9 w-auto" />
      </Link>

      <div className="flex flex-1 flex-col gap-7">
        <NavLink
          href="/staff"
          label="Dashboard"
          icon={LayoutDashboard}
          active={isActive("/staff")}
        />

        {GROUPS.map((group) => {
          // The href comes from what the entry *is*, not from the heading it
          // happens to sit under. This used to read `group === "Settings"` and
          // send anything in that group to /staff/globals/…, which was true
          // only for as long as Settings held nothing but globals — the first
          // collection filed there linked straight to a 404. A group is a
          // heading in this sidebar; it was never meant to decide a route.
          const entries = [
            ...collections.map((entry) => ({ ...entry, href: `/staff/${entry.slug}` })),
            ...mailing.map((entry) => ({ ...entry, href: `/staff/${entry.slug}` })),
            ...registers.map((entry) => ({ ...entry, href: `/staff/${entry.slug}` })),
            ...globals.map((entry) => ({
              ...entry,
              href: `/staff/globals/${entry.slug}`,
            })),
          ]
            .filter((entry) => entry.group === group)
            // What a role cannot reach is not shown greyed out — it is not
            // shown. A disabled row in a sidebar is a permanent advertisement
            // for something somebody will never be able to click, and the
            // honest sidebar for an editor is the one that describes the panel
            // they actually have.
            .filter((entry) => canSee(user, entry.key));

          // Settings empties out completely for an editor, and a heading over
          // nothing is worse than no heading.
          if (entries.length === 0) return null;

          return (
            <div key={group} className="flex flex-col gap-1.5">
              <h2 className="px-3 pb-1 text-[11px] font-semibold tracking-[0.14em] text-white-70 uppercase">
                {group}
              </h2>
              {entries.map((entry) => (
                <NavLink
                  key={entry.key}
                  href={entry.href}
                  label={entry.label}
                  icon={entry.icon}
                  active={isActive(entry.href)}
                />
              ))}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 border-t border-white-12 pt-5">
        <div className="px-3">
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          {/* The role is stated rather than left to be inferred from which
              items are missing. Somebody who cannot find Staff accounts should
              be able to see why in one glance, instead of concluding the panel
              is broken. */}
          <p className="truncate text-xs text-white-70">
            {user.role === "admin" ? "Admin" : "Editor"} · {user.email}
          </p>
        </div>

        {/* Your own account is not in Settings, which an editor cannot open.
            Changing your own password has to be reachable by everybody who has
            one — an account here starts with a password a colleague chose and
            passed on somehow, and a panel where that cannot be changed is one
            where it stays shared forever. */}
        <NavLink
          href="/staff/account"
          label="Your account"
          icon={UserRound}
          active={isActive("/staff/account")}
        />

        <form action="/staff/logout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-full px-3 py-2 text-sm font-medium text-white-94 transition-colors duration-300 hover:bg-white-12 hover:text-white"
          >
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-full px-3 py-2 text-[15px] transition-colors duration-300 ${
        active
          ? "bg-white/16 font-semibold text-white shadow-[inset_3px_0_0_0_var(--color-green)]"
          : "font-medium text-white-94 hover:bg-white-12 hover:text-white"
      }`}
    >
      <Icon className="size-4 shrink-0" aria-hidden={true} />
      {label}
    </Link>
  );
}
