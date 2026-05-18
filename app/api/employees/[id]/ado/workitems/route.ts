import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Employee } from "@/models/Employee";
import { AdoWorkItemCache } from "@/models/AdoWorkItemCache";
import { AdoClient, type AdoWorkItemDisplay } from "@/lib/ado";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  const employee = await Employee.findById(params.id).lean();
  if (!employee) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!employee.adoEnabled || !employee.adoPat || !employee.adoOrganization || !employee.adoEmail) {
    return NextResponse.json(
      { error: "ADO not configured or missing email" },
      { status: 400 },
    );
  }

  const url = new URL(req.url);
  const stateFilter = url.searchParams.get("state");
  const typeFilter = url.searchParams.get("type");
  const forceRefresh = url.searchParams.get("refresh") === "1";

  // Check cache first
  const cacheTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes cache
  if (!forceRefresh) {
    const cached = await AdoWorkItemCache.find({
      employeeId: params.id,
      fetchedAt: { $gt: cacheTime },
    }).lean();

    if (cached.length > 0) {
      let filtered = cached;
      if (stateFilter) {
        filtered = filtered.filter((c) => c.state === stateFilter);
      }
      if (typeFilter) {
        filtered = filtered.filter((c) => c.type === typeFilter);
      }
      return NextResponse.json({
        workItems: filtered.map((c) => ({
          id: c.workItemId,
          url: c.url,
          title: c.title,
          state: c.state,
          type: c.type,
          assignedTo: null, // Not cached
          createdDate: c.assignedDate?.toISOString() || "",
          remainingWork: c.remainingWork,
          completedWork: c.completedWork,
          rev: c.rev,
        })),
        cachedAt: cached[0]?.fetchedAt,
      });
    }
  }

  // Fetch from ADO
  try {
    const client = new AdoClient({
      pat: employee.adoPat,
      organization: employee.adoOrganization,
      project: employee.adoProject || undefined,
    });

    // Use the configured email to search for assigned work items
    const userEmail = employee.adoEmail;

    // Get assigned work item IDs
    const workItemIds = await client.getAssignedWorkItems(userEmail);

    if (workItemIds.length === 0) {
      return NextResponse.json({ workItems: [], cachedAt: new Date() });
    }

    // Fetch work item details
    const workItems = await client.getWorkItems(workItemIds);

    // Upsert to cache
    const cacheDocs = workItems.map((wi) => ({
      employeeId: params.id,
      workItemId: wi.id,
      url: wi.url,
      title: wi.fields["System.Title"],
      state: wi.fields["System.State"],
      type: wi.fields["System.WorkItemType"],
      assignedDate: new Date(wi.fields["System.CreatedDate"]),
      remainingWork: wi.fields["Microsoft.VSTS.Scheduling.RemainingWork"],
      completedWork: wi.fields["Microsoft.VSTS.Scheduling.CompletedWork"],
      rev: wi.rev,
      fetchedAt: new Date(),
    }));

    await AdoWorkItemCache.bulkWrite(
      cacheDocs.map((doc) => ({
        updateOne: {
          filter: { employeeId: params.id, workItemId: doc.workItemId },
          update: { $set: doc } as any,
          upsert: true,
        },
      })) as any,
    );

    // Convert to display format
    let displayItems: AdoWorkItemDisplay[] = workItems.map((wi) =>
      client.toDisplay(wi),
    );

    // Apply filters
    if (stateFilter) {
      displayItems = displayItems.filter((wi) => wi.state === stateFilter);
    }
    if (typeFilter) {
      displayItems = displayItems.filter((wi) => wi.type === typeFilter);
    }

    return NextResponse.json({
      workItems: displayItems,
      cachedAt: new Date(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
