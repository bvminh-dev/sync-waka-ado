import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { CalendarEvent } from "@/models/CalendarEvent";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json({ error: "start & end required" }, { status: 400 });
  }
  const events = await CalendarEvent.find({
    employeeId: params.id,
    start: { $gte: new Date(start), $lt: new Date(end) },
  })
    .sort({ start: 1 })
    .lean();
  return NextResponse.json({ events });
}
