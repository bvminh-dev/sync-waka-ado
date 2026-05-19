import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Employee } from "@/models/Employee";
import { CalendarEvent } from "@/models/CalendarEvent";
import { OutlookClient, parseGraphDate } from "@/lib/outlook";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json({ error: "start & end required" }, { status: 400 });
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(+startDate) || isNaN(+endDate)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const employees = await Employee.find({
    outlookEnabled: true,
    outlookAccessToken: { $ne: null },
  });

  const results: Array<{
    employeeId: string;
    name: string;
    count?: number;
    error?: string;
  }> = [];

  for (const emp of employees) {
    try {
      const client = new OutlookClient(
        {
          authType: emp.outlookAuthType,
          clientId: emp.outlookClientId,
          clientSecret: emp.outlookClientSecret,
          tenantId: emp.outlookTenantId,
          accessToken: emp.outlookAccessToken,
          refreshToken: emp.outlookRefreshToken,
          tokenExpiresAt: emp.outlookTokenExpiresAt,
        },
        async (accessToken, refreshToken, expiresAt) => {
          await Employee.findByIdAndUpdate(emp._id, {
            outlookAccessToken: accessToken,
            outlookRefreshToken: refreshToken,
            outlookTokenExpiresAt: expiresAt,
          });
        },
      );
      const events = await client.listEvents(startDate, endDate);
      await CalendarEvent.deleteMany({
        employeeId: emp._id,
        start: { $gte: startDate, $lt: endDate },
      });
      if (events.length > 0) {
        const now = new Date();
        await CalendarEvent.bulkWrite(
          events.map((ev) => ({
            updateOne: {
              filter: { employeeId: emp._id, graphId: ev.id },
              update: {
                $set: {
                  employeeId: emp._id,
                  graphId: ev.id,
                  subject: ev.subject ?? "",
                  bodyPreview: ev.bodyPreview ?? null,
                  start: parseGraphDate(ev.start),
                  end: parseGraphDate(ev.end),
                  isAllDay: !!ev.isAllDay,
                  location: ev.location?.displayName ?? null,
                  organizer:
                    ev.organizer?.emailAddress?.name ??
                    ev.organizer?.emailAddress?.address ??
                    null,
                  attendees: (ev.attendees ?? [])
                    .map(
                      (a) =>
                        a.emailAddress?.name ?? a.emailAddress?.address ?? "",
                    )
                    .filter(Boolean),
                  showAs: ev.showAs ?? null,
                  webLink: ev.webLink ?? null,
                  fetchedAt: now,
                },
              },
              upsert: true,
            },
          })),
        );
      }
      results.push({
        employeeId: String(emp._id),
        name: emp.name,
        count: events.length,
      });
    } catch (e: unknown) {
      results.push({
        employeeId: String(emp._id),
        name: emp.name,
        error: e instanceof Error ? e.message : "Sync failed",
      });
    }
  }
  return NextResponse.json({ ok: true, results });
}
