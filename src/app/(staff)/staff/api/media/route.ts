import { NextResponse } from "next/server";

import { currentUser } from "@/staff/auth/session";
import { createMedia } from "@/staff/queries/upload";

/**
 * Uploading from inside the picker.
 *
 * The media form posts to a server action and reloads, which is right for a
 * page whose whole job is adding a file. It is wrong halfway through writing a
 * news item: leaving the editor to go and upload a photograph loses everything
 * typed so far, which is why people were duplicating rows and pasting drafts
 * into a text file first.
 *
 * So the dialog posts here instead and stays where it is. Same `createMedia`
 * the form uses — one set of rules about what may be uploaded, one place that
 * writes the bytes — and the response is shaped as a `PickerOption` so the
 * dialog can put the new file straight into its grid and select it.
 *
 * A route handler rather than a server action because the caller wants the row
 * back to render, not a page transition.
 */
export async function POST(request: Request) {
  // The panel is behind a session everywhere else; an upload endpoint that
  // forgot to check would be an open write to the server's disk.
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Your session has expired. Sign in again." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "That upload did not arrive complete. Try again." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Choose a file to upload." }, { status: 400 });
  }

  const result = await createMedia(
    file,
    String(form.get("alt") ?? ""),
    String(form.get("credit") ?? ""),
  );

  if (!result.ok) {
    // A rejected upload is the user's to fix — a wrong file type, a file too
    // big, a missing description — so it is a 400 with the sentence attached,
    // not a 500.
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    media: {
      id: result.id,
      filename: result.filename,
      alt: String(form.get("alt") ?? "").trim(),
      mimeType: result.mimeType,
      url: result.url,
      thumb: result.sizes,
    },
  });
}
