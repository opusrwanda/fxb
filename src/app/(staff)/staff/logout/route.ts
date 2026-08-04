import { NextResponse } from "next/server";

import { destroySession } from "@/staff/auth/session";

/**
 * Sign out.
 *
 * A POST, not a link. A GET that logs you out can be triggered by anything that
 * can put a URL on a page — an image tag on another site is enough — and while
 * being signed out is not the worst thing an attacker can do to you, it is not
 * something a third party should be able to decide.
 */
export async function POST(request: Request) {
  await destroySession();
  return NextResponse.redirect(new URL("/staff/login", request.url), {
    status: 303,
  });
}
