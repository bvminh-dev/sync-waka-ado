import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Employee } from "@/models/Employee";
import { CalendarEvent } from "@/models/CalendarEvent";
import { OutlookClient, OutlookError, parseGraphDate } from "@/lib/outlook";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json(
      { error: "start & end (ISO date) required" },
      { status: 400 },
    );
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(+startDate) || isNaN(+endDate)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const emp = await Employee.findById(params.id);
  if (!emp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!emp.outlookEnabled || !emp.outlookAccessToken) {
    return NextResponse.json(
      { error: "Outlook chưa được kết nối" },
      { status: 400 },
    );
  }
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
        await Employee.findByIdAndUpdate(params.id, {
          outlookAccessToken: accessToken,
          outlookRefreshToken: refreshToken,
          outlookTokenExpiresAt: expiresAt,
        });
      },
    );
    const events = await client.listEvents(startDate, endDate);
    const now = new Date();
    // Replace cache in this range, then upsert
    await CalendarEvent.deleteMany({
      employeeId: emp._id,
      start: { $gte: startDate, $lt: endDate },
    });
    if (events.length > 0) {
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
    return NextResponse.json({ ok: true, count: events.length });
  } catch (e: unknown) {
    const status = e instanceof OutlookError ? e.status : 500;
    const msg = e instanceof Error ? e.message : "Sync failed";
    return NextResponse.json({ error: msg }, { status: status >= 500 ? 502 : status });
  }
}
