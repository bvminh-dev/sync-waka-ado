import { NextResponse } from "next/server";
import { aggregateWorkItemTime } from "@/lib/aggregate-ado";
import { resolveRange, type RangePreset } from "@/lib/ranges";
import { connectDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const preset = (searchParams.get("preset") ?? "week") as RangePreset;
  const employeeId = searchParams.get("employeeId") || undefined;
  let start = searchParams.get("start");
  let end = searchParams.get("end");
  if (!start || !end) {
    const r = resolveRange(preset);
    start = r.start;
    end = r.end;
  }
  const data = await aggregateWorkItemTime(start, end, employeeId);
  return NextResponse.json(data);
}
