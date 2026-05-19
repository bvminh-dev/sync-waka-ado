import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { CalendarEvent } from "@/models/CalendarEvent";
import { Employee } from "@/models/Employee";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const employeeIdsParam = searchParams.get("employeeIds");
  if (!start || !end) {
    return NextResponse.json({ error: "start & end required" }, { status: 400 });
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(+startDate) || isNaN(+endDate)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const query: Record<string, unknown> = {
    // overlap: event.start < end && event.end > start
    start: { $lt: endDate },
    end: { $gt: startDate },
  };
  if (employeeIdsParam) {
    const ids = employeeIdsParam.split(",").filter(Boolean);
    if (ids.length > 0) query.employeeId = { $in: ids };
  }
  const events = await CalendarEvent.find(query).sort({ start: 1 }).lean();

  const empIds = Array.from(new Set(events.map((e) => String(e.employeeId))));
  const employees = empIds.length
    ? await Employee.find({ _id: { $in: empIds } })
        .select("_id name outlookEmail")
        .lean()
    : [];
  const empMap = new Map(employees.map((e) => [String(e._id), e]));

  const enriched = events.map((ev) => {
    const emp = empMap.get(String(ev.employeeId));
    return {
      _id: String(ev._id),
      employeeId: String(ev.employeeId),
      employeeName: emp?.name ?? "Unknown",
      subject: ev.subject,
      bodyPreview: ev.bodyPreview,
      start: ev.start,
      end: ev.end,
      isAllDay: ev.isAllDay,
      location: ev.location,
      organizer: ev.organizer,
      showAs: ev.showAs,
      webLink: ev.webLink,
    };
  });

  // list of employees with outlook enabled (for filter dropdown)
  const allEnabled = await Employee.find({ outlookEnabled: true })
    .select("_id name outlookEmail")
    .lean();
  return NextResponse.json({
    events: enriched,
    employees: allEnabled.map((e) => ({
      _id: String(e._id),
      name: e.name,
      email: e.outlookEmail ?? null,
    })),
  });
}
