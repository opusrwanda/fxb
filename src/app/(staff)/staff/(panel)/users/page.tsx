import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { currentUser } from "@/staff/auth/session";
import {
  changeOwnPassword,
  createUser,
  deleteUser,
  listUsers,
  setRole,
} from "@/staff/queries/users";
import { ConfirmDialog } from "@/staff/ui/confirm-dialog";
import { PasswordField } from "@/staff/ui/password-field";

export const metadata = { title: "Staff accounts" };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const input =
  "w-full rounded-card border border-gray-15 bg-white px-4 py-3 text-[15px] text-gray transition-colors duration-300 outline-none focus:border-blue";

/**
 * Who can sign in.
 *
 * The schema has said since it was written that `admin` manages other people
 * and `editor` does everything else, and nothing had ever created an account —
 * every user in the database was seeded, so adding a colleague meant a
 * database client and a hand-computed scrypt hash.
 *
 * Admin-only, and checked here rather than only hidden from the sidebar. A
 * hidden link is a hint, not a permission; an editor who knows the URL is
 * still an editor.
 *
 * Changing your own password sits on the same page, and is not decoration: an
 * account created here starts with a password somebody else chose and had to
 * pass on, and without this that password stays shared for as long as the
 * account exists.
 */
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; added?: string; changed?: string }>;
}) {
  const { error, added, changed } = await searchParams;
  const me = await currentUser();
  if (!me) redirect("/staff/login");

  const admin = me.role === "admin";
  const people = admin ? await listUsers() : [];

  async function add(formData: FormData) {
    "use server";

    const actor = await currentUser();
    if (actor?.role !== "admin") redirect("/staff");

    const result = await createUser({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? "editor"),
    });

    if (!result.ok) {
      redirect(`/staff/users?error=${encodeURIComponent(result.error)}`);
    }
    revalidatePath("/staff/users");
    redirect("/staff/users?added=1");
  }

  async function changeRole(formData: FormData) {
    "use server";

    const actor = await currentUser();
    if (actor?.role !== "admin") redirect("/staff");

    const result = await setRole(
      Number(formData.get("id")),
      String(formData.get("role") ?? "editor"),
    );
    if (!result.ok) {
      redirect(`/staff/users?error=${encodeURIComponent(result.error)}`);
    }
    revalidatePath("/staff/users");
    redirect("/staff/users");
  }

  async function changePassword(formData: FormData) {
    "use server";

    const actor = await currentUser();
    if (!actor) redirect("/staff/login");

    const result = await changeOwnPassword(
      actor.id,
      String(formData.get("current") ?? ""),
      String(formData.get("next") ?? ""),
    );

    if (!result.ok) {
      redirect(`/staff/users?error=${encodeURIComponent(result.error)}`);
    }

    // Every session for the account has just been dropped, this one included,
    // so there is nowhere to go but the sign-in — which is the honest outcome
    // and not a bug.
    redirect("/staff/login?changed=1");
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
          Everyone who can sign in to this panel. Admins can add and remove
          colleagues; editors can do everything else.
        </p>
      </header>

      {added && (
        <p
          role="status"
          className="mt-8 rounded-card border border-green/30 bg-green-10 px-5 py-4 text-[15px] text-gray"
        >
          <strong className="font-semibold text-green">Added.</strong> They can
          sign in with the address and password you set.
        </p>
      )}

      {changed && (
        <p
          role="status"
          className="mt-8 rounded-card border border-green/30 bg-green-10 px-5 py-4 text-[15px] text-gray"
        >
          <strong className="font-semibold text-green">Changed.</strong>
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

      {admin && (
        <>
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
                <input id="user-name" name="name" required maxLength={200} className={input} />
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
              </div>

              <div className="flex flex-col gap-2">
                {/* The same control the sign-in uses, so a long password can be
                    read back while typing rather than guessed at. It carries
                    its own label, which is why there is not one here. */}
                <PasswordField
                  label="First password"
                  name="password"
                  autoComplete="new-password"
                  required
                />
                <p className="text-[13px] leading-relaxed text-gray-80">
                  At least 12 characters — four ordinary words is a good one.
                  Tell it to them in person; they can change it here once they
                  are in.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="user-role" className="text-sm font-semibold text-blue">
                  Role
                </label>
                <p id="user-role-help" className="text-[13px] leading-relaxed text-gray-80">
                  Only an admin can add or remove people.
                </p>
                <select
                  id="user-role"
                  name="role"
                  defaultValue="editor"
                  aria-describedby="user-role-help"
                  className={input}
                >
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

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
                      {person.id === me!.id && (
                        <span className="ml-2 rounded-full bg-blue-08 px-2.5 py-0.5 text-xs font-semibold text-blue">
                          you
                        </span>
                      )}
                    </p>
                    <p className="mt-1 truncate text-sm text-gray">
                      {person.email} · added {dateFormat.format(person.createdAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-5">
                    <form action={changeRole} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={person.id} />
                      <label htmlFor={`role-${person.id}`} className="sr-only">
                        Role for {person.name}
                      </label>
                      <select
                        id={`role-${person.id}`}
                        name="role"
                        defaultValue={person.role}
                        className="rounded-full border border-gray-15 bg-white px-4 py-2 text-sm text-gray outline-none focus:border-blue"
                      >
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        type="submit"
                        className="text-sm font-semibold text-blue underline underline-offset-4"
                      >
                        Set
                      </button>
                    </form>

                    {person.id !== me!.id && (
                      <ConfirmDialog
                        action={async () => {
                          "use server";
                          const actor = await currentUser();
                          if (actor?.role !== "admin") redirect("/staff");
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
        </>
      )}

      <section className={admin ? "mt-14" : "mt-10"}>
        <h2 className="text-xl font-bold tracking-[-0.02em] text-blue">
          Change your password
        </h2>
        <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-gray">
          You will be signed out everywhere and will need to sign in again with
          the new one.
        </p>

        <form
          action={changePassword}
          className="mt-5 grid max-w-xl gap-5 rounded-card border border-gray-15 p-6"
        >
          <PasswordField
            label="Current password"
            name="current"
            autoComplete="current-password"
            required
          />

          <PasswordField
            label="New password"
            name="next"
            autoComplete="new-password"
            required
          />

          <div>
            <button
              type="submit"
              className="inline-flex h-12 items-center rounded-full bg-blue px-8 text-base font-semibold text-white transition-colors duration-300 hover:bg-blue-90"
            >
              Change password
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
