import { adminOrNull } from "@/staff/auth/guard";
import { subscribersCsv } from "@/staff/mail/subscribers";

/**
 * The list as a CSV.
 *
 * Admin only, and checked here rather than anywhere else — this is the one URL
 * that hands over every address at once, and a route handler does not sit
 * under the panel layout that does the checking. Hiding the button on the
 * subscribers page is a courtesy; this is the lock.
 *
 * 404 rather than 403, deliberately. There is nothing to be gained by telling
 * somebody who should not have this that it is here.
 */
export async function GET() {
  if (!(await adminOrNull())) {
    return new Response("Not found", { status: 404 });
  }

  const csv = await subscribersCsv();

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="fxb-subscribers.csv"',
      "Cache-Control": "no-store",
    },
  });
}
