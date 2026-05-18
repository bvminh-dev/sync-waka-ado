import { NextResponse } from "next/server";
import { aggregateDashboard } from "@/lib/aggregate";
import { resolveRange, type RangePreset } from "@/lib/ranges";
import { syncEmployeeRange } from "@/lib/sync";
import { Employee } from "@/models/Employee";
import { connectDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const preset = (searchParams.get("preset") ?? "day") as RangePreset;
  const sync = searchParams.get("sync") === "1";
  let start = searchParams.get("start");
  let end = searchParams.get("end");
  if (!start || !end) {
    const r = resolveRange(preset);
    start = r.start;
    end = r.end;
  }
  if (sync) {
    const employees = await Employee.find({}, { _id: 1 }).lean();
    await Promise.allSettled(
      employees.map((e) => syncEmployeeRange(String(e._id), start!, end!)),
    );
  }
  const data = await aggregateDashboard(start, end);
  return NextResponse.json(data);
}
