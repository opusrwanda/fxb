import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/staff/auth/guard";
import { createUser, deleteUser, listUsers, setRole } from "@/staff/queries/users";
import { ConfirmDialog } from "@/staff/ui/confirm-dialog";
import { PasswordField } from "@/staff/ui/password-field";
import type { Role } from "@/staff/db/schema";

export const metadata = { title: "Staff accounts" };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const input =
  "w-full rounded-card border border-gray-15 bg-white px-4 py-3 text-[15px] text-gray transition-colors duration-300 outline-none focus:border-blue";

/** The two roles, described in terms of what the person will be able to do. */
const ROLES: { value: Role; label: string; blurb: string }[] = [
  {
    value: "editor",
    label: "Editor",
    blurb:
      "Writes news, stories and publications, and uploads to the library. Can publish their own work, or send it to an admin to check first. Everything else — programmes, people, the mailing list, the settings — they can read and not change.",
  },
  {
    value: "admin",
    label: "Admin",
    blurb:
      "Everything, including the things that cannot be undone: sending to the mailing list, exporting it, deleting, the site settings, and adding or removing colleagues.",
  },
];

/**
 * Who can sign in, and as what.
 *
 * Admin only, and that is the point of the page rather than an aside: this is
 * where somebody is handed the mailing list and the settings, so it is exactly
 * the page an editor must not be able to open.
 *
 * Changing your own password is NOT here any more. It used to be, which was
 * fine when everybody could open this page and is not now — an editor has a
 * password and has to be able to change it. It lives at `/staff/account`,
 * which everybody signed in can reach.
 */
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; added?: string; changed?: string }>;
}) {
  const { error, added, changed } = await searchParams;
  const me = await requireAdmin("users");

  const people = await listUsers();

  async function add(formData: FormData) {
    "use server";

    // Re-checked inside the action, not inherited from the render. A server
    // action is an endpoint; the page having refused to render for an editor
    // does not stop one posting to it.
    await requireAdmin("users");

    const result = await createUser({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? "editor") === "admin" ? "admin" : "editor",
    });

    if (!result.ok) {
      redirect(`/staff/users?error=${encodeURIComponent(result.error)}`);
    }
    revalidatePath("/staff/users");
    redirect("/staff/users?added=1");
  }

  async function changeRole(formData: FormData) {
    "use server";

    await requireAdmin("users");

    const result = await setRole(
      Number(formData.get("id")),
      String(formData.get("role") ?? "editor") === "admin" ? "admin" : "editor",
    );

    if (!result.ok) {
      redirect(`/staff/users?error=${encodeURIComponent(result.error)}`);
    }
    revalidatePath("/staff/users");
    redirect("/staff/users?changed=1");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
          <span className="text-xs font-semibold tracking-[0.14em] text-gray-80 uppercase">
            Settings
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[38px] lg:leading-[1.1]">
          Staff accounts
        </h1>
        <p className="max-w-[58ch] text-base leading-relaxed text-gray">
          Everyone who can sign in to this panel, and what each of them is able
          to do. Only admins can open this page.
        </p>
      </header>

      {added && (
        <p
          role="status"
          className="mt-8 rounded-card border border-green/30 bg-green-10 px-5 py-4 text-[15px] text-gray"
        >
          <strong className="font-semibold text-green">Added.</strong> They can
          sign in with the address and password you set. A code will be emailed
          to them each time they do.
        </p>
      )}

      {changed && (
        <p
          role="status"
          className="mt-8 rounded-card border border-green/30 bg-green-10 px-5 py-4 text-[15px] text-gray"
        >
          <strong className="font-semibold text-green">Changed.</strong> It
          takes effect the next time they load a page.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-8 rounded-card border border-gray-15 bg-blue-08 px-5 py-4 text-[15px] text-gray"
        >
          <strong className="font-semibold text-blue">Not done.</strong> {error}
        </p>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-[-0.02em] text-blue">
          Add somebody
        </h2>
        <form
          action={add}
          className="mt-5 grid gap-5 rounded-card border border-gray-15 p-6 sm:grid-cols-2"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="user-name" className="text-sm font-semibold text-blue">
              Name
            </label>
            <input
              id="user-name"
              name="name"
              required
              maxLength={200}
              className={input}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="user-email" className="text-sm font-semibold text-blue">
              Email address
            </label>
            <input
              id="user-email"
              name="email"
              type="email"
              required
              maxLength={255}
              autoComplete="off"
              className={input}
            />
            <p className="text-[13px] leading-relaxed text-gray-80">
              Sign-in codes are sent here, so it has to be an address they can
              actually read.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {/* The same control the sign-in uses, so a long password can be
                read back while typing rather than guessed at. It carries its
                own label, which is why there is not one here. */}
            <PasswordField
              label="First password"
              name="password"
              autoComplete="new-password"
              required
            />
            <p className="text-[13px] leading-relaxed text-gray-80">
              At least 12 characters — four ordinary words is a good one. Tell
              it to them in person; they can change it under Your account once
              they are in.
            </p>
          </div>

          {/* Radios rather than a select, because the choice needs a sentence
              of explanation each and a dropdown has nowhere to put one. This
              is a decision somebody makes once per colleague and should be
              able to make on what is in front of them. */}
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-semibold text-blue">
              What they can do
            </legend>
            {ROLES.map((role, index) => (
              <label
                key={role.value}
                className="flex cursor-pointer gap-3 rounded-card border border-gray-15 p-4 transition-colors duration-300 hover:border-blue has-checked:border-blue has-checked:bg-blue-08"
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  defaultChecked={index === 0}
                  className="mt-1 size-4 shrink-0 accent-blue"
                />
                <span>
                  <span className="block text-[15px] font-semibold text-blue">
                    {role.label}
                  </span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-gray">
                    {role.blurb}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="inline-flex h-12 items-center rounded-full bg-blue px-8 text-base font-semibold text-white transition-colors duration-300 hover:bg-blue-90"
            >
              Add person
            </button>
          </div>
        </form>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-bold tracking-[-0.02em] text-blue">
          {people.length} {people.length === 1 ? "person" : "people"}
        </h2>

        <ul className="mt-5 flex flex-col gap-4">
          {people.map((person) => (
            <li
              key={person.id}
              className="flex flex-col gap-4 rounded-card border border-gray-15 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-blue">
                  {person.name}
                  {person.id === me.id && (
                    <span className="ml-2 rounded-full bg-blue-08 px-2.5 py-0.5 text-xs font-semibold text-blue">
                      you
                    </span>
                  )}
                </p>
                <p className="mt-1 truncate text-sm text-gray">
                  {person.email} · added {dateFormat.format(person.createdAt)}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-5">
                {/* A select that submits on change would move somebody
                    between roles on a mis-click. It submits on a button, and
                    the button says which way it is going. */}
                <form action={changeRole} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={person.id} />
                  <label
                    htmlFor={`role-${person.id}`}
                    className="text-sm font-medium text-gray-80"
                  >
                    Role
                  </label>
                  <select
                    id={`role-${person.id}`}
                    name="role"
                    defaultValue={person.role}
                    className="rounded-card border border-gray-15 bg-white px-3 py-2 text-sm text-gray outline-none focus:border-blue"
                  >
                    {ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-full px-3 py-2 text-sm font-semibold text-blue transition-colors duration-300 hover:bg-blue-08"
                  >
                    Save
                  </button>
                </form>

                {person.id !== me.id && (
                  <ConfirmDialog
                    action={async () => {
                      "use server";
                      const actor = await requireAdmin("users");
                      const result = await deleteUser(person.id, actor.id);
                      if (!result.ok) {
                        redirect(
                          `/staff/users?error=${encodeURIComponent(result.error)}`,
                        );
                      }
                      revalidatePath("/staff/users");
                      redirect("/staff/users");
                    }}
                    triggerLabel="Remove"
                    title={`Remove ${person.name}?`}
                    body={`${person.name} will no longer be able to sign in, and will be signed out anywhere they currently are. Nothing they have written is affected. This cannot be undone, but the account can be created again.`}
                    confirmLabel="Remove access"
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
