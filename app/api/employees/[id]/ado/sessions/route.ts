import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Employee } from "@/models/Employee";
import { TimeTrackingSession } from "@/models/TimeTrackingSession";
import { AdoClient } from "@/lib/ado";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();

  const activeSession = await TimeTrackingSession.findOne({
    employeeId: params.id,
    completedAt: null,
  }).lean();

  if (!activeSession) {
    return NextResponse.json({ session: null });
  }

  return NextResponse.json({
    session: {
      id: String(activeSession._id),
      workItemId: activeSession.adoWorkItemId,
      startedAt: activeSession.startedAt,
    },
  });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  const body = await req.json();
  const { workItemId } = body;

  if (!workItemId) {
    return NextResponse.json(
      { error: "Thiếu workItemId" },
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

  try {
    const client = new AdoClient({
      pat: employee.adoPat,
      organization: employee.adoOrganization,
      project: employee.adoProject || undefined,
    });

    // End any existing active session
    const existingSession = await TimeTrackingSession.findOne({
      employeeId: params.id,
      completedAt: null,
    });

    if (existingSession) {
      // Calculate elapsed time
      const elapsedMs =
        new Date().getTime() - existingSession.startedAt.getTime();
      const elapsedHours = elapsedMs / (1000 * 60 * 60);

      // Fetch current work item to get revision
      const currentItems = await client.getWorkItems([existingSession.adoWorkItemId]);
      if (currentItems.length > 0) {
        const currentWi = currentItems[0];
        const currentCompletedWork =
          currentWi.fields["Microsoft.VSTS.Scheduling.CompletedWork"] || 0;
        const currentRemainingWork =
          currentWi.fields["Microsoft.VSTS.Scheduling.RemainingWork"];

        // Update work item
        const updateData: {
          completedWork: number;
          remainingWork?: number;
        } = {
          completedWork: currentCompletedWork + elapsedHours,
        };

        if (typeof currentRemainingWork === "number") {
          updateData.remainingWork = Math.max(0, currentRemainingWork - elapsedHours);
        }

        await client.updateTimeTracking(existingSession.adoWorkItemId, updateData);
      }

      // Mark session as completed
      await TimeTrackingSession.findByIdAndUpdate(existingSession._id, {
        completedAt: new Date(),
        completedWork: elapsedHours,
      });
    }

    // Create new session — không gọi ADO khi start, chỉ lưu DB
    const newSession = await TimeTrackingSession.create({
      employeeId: params.id,
      adoWorkItemId: workItemId,
      startedAt: new Date(),
    });

    return NextResponse.json({
      session: {
        id: String(newSession._id),
        workItemId: newSession.adoWorkItemId,
        startedAt: newSession.startedAt,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  const body = await req
    .json()
    .catch(() => ({} as { completedWork?: number }));
  const { completedWork } = body;

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

  try {
    const client = new AdoClient({
      pat: employee.adoPat,
      organization: employee.adoOrganization,
      project: employee.adoProject || undefined,
    });

    // Find active session
    const activeSession = await TimeTrackingSession.findOne({
      employeeId: params.id,
      completedAt: null,
    });

    if (!activeSession) {
      return NextResponse.json(
        { error: "No active session" },
        { status: 404 },
      );
    }

    // Calculate elapsed time
    const elapsedMs = new Date().getTime() - activeSession.startedAt.getTime();
    const elapsedHours = completedWork || elapsedMs / (1000 * 60 * 60);

    // Fetch current work item
    const currentItems = await client.getWorkItems([activeSession.adoWorkItemId]);
    if (currentItems.length === 0) {
      return NextResponse.json(
        { error: "Work item not found" },
        { status: 404 },
      );
    }

    const currentWi = currentItems[0];
    const currentCompletedWork =
      currentWi.fields["Microsoft.VSTS.Scheduling.CompletedWork"] || 0;
    const currentRemainingWork =
      currentWi.fields["Microsoft.VSTS.Scheduling.RemainingWork"];

    // Update work item
    const updateData: {
      completedWork: number;
      remainingWork?: number;
    } = {
      completedWork: currentCompletedWork + elapsedHours,
    };

    if (typeof currentRemainingWork === "number") {
      updateData.remainingWork = Math.max(0, currentRemainingWork - elapsedHours);
    }

    const updatedWi = await client.updateTimeTracking(
      activeSession.adoWorkItemId,
      updateData,
    );

    // Mark session as completed
    await TimeTrackingSession.findByIdAndUpdate(activeSession._id, {
      completedAt: new Date(),
      completedWork: elapsedHours,
    });

    return NextResponse.json({
      session: {
        id: String(activeSession._id),
        workItemId: activeSession.adoWorkItemId,
        startedAt: activeSession.startedAt,
        completedAt: new Date(),
        completedWork: elapsedHours,
      },
      workItem: client.toDisplay(updatedWi),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
