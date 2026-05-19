import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Employee } from "@/models/Employee";
import { AdoClient } from "@/lib/ado";

export const dynamic = "force-dynamic";

interface LogWorkItem {
  workItemId: number;
  hours: number;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  const body = await req.json();

  const items: LogWorkItem[] = body.items
    ? body.items
    : [{ workItemId: body.workItemId, hours: body.hours }];

  if (!items.length || items.some((i) => !i.workItemId || !i.hours || i.hours <= 0)) {
    return NextResponse.json(
      { error: "Thiếu workItemId hoặc hours" },
      { status: 400 },
    );
  }

  const employee = await Employee.findById(params.id).lean();
  if (!employee) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!employee.adoEnabled || !employee.adoPat || !employee.adoOrganization) {
    return NextResponse.json(
      { error: "ADO not configured" },
      { status: 400 },
    );
  }

  const client = new AdoClient({
    pat: employee.adoPat,
    organization: employee.adoOrganization,
    project: employee.adoProject || undefined,
  });

  const results: { workItemId: number; success: boolean; error?: string }[] = [];

  const workItemIds = items.map((i) => i.workItemId);
  const hoursMap = new Map(items.map((i) => [i.workItemId, i.hours]));

  try {
    const currentItems = await client.getWorkItems(workItemIds);
    const currentMap = new Map(currentItems.map((wi) => [wi.id, wi]));

    for (const item of items) {
      try {
        const current = currentMap.get(item.workItemId);
        if (!current) {
          results.push({
            workItemId: item.workItemId,
            success: false,
            error: "Work item not found",
          });
          continue;
        }

        const currentCompleted =
          current.fields["Microsoft.VSTS.Scheduling.CompletedWork"] || 0;
        const currentRemaining =
          current.fields["Microsoft.VSTS.Scheduling.RemainingWork"];

        const updateData: { completedWork: number; remainingWork?: number } = {
          completedWork: currentCompleted + item.hours,
        };

        if (typeof currentRemaining === "number") {
          updateData.remainingWork = Math.max(0, currentRemaining - item.hours);
        }

        await client.updateTimeTracking(item.workItemId, updateData);
        results.push({ workItemId: item.workItemId, success: true });
      } catch (e: unknown) {
        results.push({
          workItemId: item.workItemId,
          success: false,
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ results });
}
