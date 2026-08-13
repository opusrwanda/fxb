import { redirect } from "next/navigation";

import { requireUser } from "@/staff/auth/guard";
import { changeOwnPassword } from "@/staff/queries/users";
import { PasswordField } from "@/staff/ui/password-field";

export const metadata = { title: "Your account" };

/**
 * Your own account.
 *
 * Split out of Staff accounts, which is now admin-only. Changing your own
 * password is not an administrative act — it is something everybody with an
 * account has to be able to do, and an editor could no longer reach it once
 * Settings closed to them.
 *
 * It matters more here than in most panels: an account is created by a
 * colleague who chooses the first password and passes it on somehow — spoken
 * across a desk, or worse, sent in a message. Until it is changed, that
 * password is shared, and the person it belongs to is the only one who can
 * un-share it.
 */
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const me = await requireUser();

  async function changePassword(formData: FormData) {
    "use server";

    const actor = await requireUser();

    const result = await changeOwnPassword(
      actor.id,
      String(formData.get("current") ?? ""),
      String(formData.get("next") ?? ""),
    );

    if (!result.ok) {
      redirect(`/staff/account?error=${encodeURIComponent(result.error)}`);
    }

    // Every session for the account has just been dropped, this one included,
    // so there is nowhere to go but the sign-in — which is the honest outcome
    // and not a bug.
    redirect("/staff/login?changed=1");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
          <span className="text-xs font-semibold tracking-[0.14em] text-gray-80 uppercase">
            Your account
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[38px] lg:leading-[1.1]">
          {me.name}
        </h1>
        <p className="max-w-[58ch] text-base leading-relaxed text-gray">
          You are signed in as {me.email}.
        </p>
      </header>

      <section className="mt-10 rounded-card border border-gray-15 p-6">
        <h2 className="text-[15px] font-semibold text-blue">
          What you can do here
        </h2>
        <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-gray">
          {me.role === "admin" ? (
            <>
              You are an <strong className="font-semibold text-blue">admin</strong>
              . Everything in the panel is yours, including the mailing list, the
              site settings and these staff accounts.
            </>
          ) : (
            <>
              You are an <strong className="font-semibold text-blue">editor</strong>
              . You write news, stories and publications, and upload to the
              library. You can publish your own work yourself, or set it to
              &ldquo;send to an admin to check&rdquo; if you would rather somebody
              looked first. Programmes, people, the mailing list and the settings
              you can read but not change — ask an admin if one of those needs an
              edit.
            </>
          )}
        </p>
      </section>

      {error && (
        <p
          role="alert"
          className="mt-8 rounded-card border border-gray-15 bg-blue-08 px-5 py-4 text-[15px] text-gray"
        >
          <strong className="font-semibold text-blue">Not changed.</strong>{" "}
          {error}
        </p>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-[-0.02em] text-blue">
          Change your password
        </h2>
        <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-gray">
          You will be signed out everywhere and will need to sign in again with
          the new one.
        </p>

        <form
          action={changePassword}
          className="mt-5 grid gap-5 rounded-card border border-gray-15 p-6"
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
