import { currentUser } from "@/staff/auth/session";
import { subscribersCsv } from "@/staff/mail/subscribers";

/**
 * The list as a CSV.
 *
 * Behind the session check like everything else in the panel — this is the one
 * URL that hands over every address at once, and a route handler does not sit
 * under the panel layout that does the checking.
 */
export async function GET() {
  if (!(await currentUser())) {
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
