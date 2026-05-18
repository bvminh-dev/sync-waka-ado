import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Employee } from "@/models/Employee";
import { AdoClient } from "@/lib/ado";

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

  if (!employee.adoEnabled || !employee.adoPat || !employee.adoOrganization) {
    return NextResponse.json(
      { error: "ADO not configured" },
      { status: 400 },
    );
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type");

  if (!type) {
    return NextResponse.json(
      { error: "Missing type parameter" },
      { status: 400 },
    );
  }

  try {
    const client = new AdoClient({
      pat: employee.adoPat,
      organization: employee.adoOrganization,
      project: employee.adoProject || undefined,
    });

    const states = await client.getWorkItemStates(type);

    return NextResponse.json({ states });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
