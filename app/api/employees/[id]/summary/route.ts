import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DailySummary } from "@/models/DailySummary";
import { syncEmployeeRange } from "@/lib/sync";
import { todayStr } from "@/lib/ranges";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? todayStr();
  const refresh = searchParams.get("refresh") === "1";

  let cached = refresh
    ? null
    : await DailySummary.findOne({
        employeeId: params.id,
        date,
      }).lean();

  if (!cached) {
    try {
      await syncEmployeeRange(params.id, date, date);
    } catch (e: unknown) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Sync failed" },
        { status: 502 },
      );
    }
    cached = await DailySummary.findOne({
      employeeId: params.id,
      date,
    }).lean();
  }
  return NextResponse.json({
    date,
    totalSeconds: cached?.totalSeconds ?? 0,
    projects: cached?.projects ?? [],
  });
}
