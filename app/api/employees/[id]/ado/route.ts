import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Employee } from "@/models/Employee";
import { encrypt } from "@/lib/crypto";
import { validateAdoPat, AdoError } from "@/lib/ado";
import { AdoWorkItemCache } from "@/models/AdoWorkItemCache";

function normalizeTypes(input: unknown): string[] | undefined {
  if (input === undefined) return undefined;
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of input) {
    const s = String(v ?? "").trim();
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  const employee = await Employee.findById(params.id).lean();
  if (!employee) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Never return the PAT
  return NextResponse.json({
    organization: employee.adoOrganization,
    project: employee.adoProject,
    email: employee.adoEmail,
    enabled: employee.adoEnabled ?? false,
    workItemTypes: employee.adoWorkItemTypes ?? [],
  });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  const body = await req.json();
  const { pat, organization, project, email } = body;
  const workItemTypes = normalizeTypes(body.workItemTypes) ?? [];

  console.log('[ADO POST] Received request for employee:', params.id);
  console.log('[ADO POST] Organization:', organization);
  console.log('[ADO POST] Project:', project);
  console.log('[ADO POST] Email:', email);

  if (!pat || !organization || !email) {
    return NextResponse.json(
      { error: "Thiếu PAT, organization hoặc email" },
      { status: 400 },
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Email không đúng định dạng" },
      { status: 400 },
    );
  }

  // Validate PAT with ADO
  try {
    console.log('[ADO POST] Validating PAT...');
    await validateAdoPat(pat, organization);
    console.log('[ADO POST] PAT validation successful');
  } catch (e: unknown) {
    console.error('[ADO POST] PAT validation failed:', e);
    const status = e instanceof AdoError ? e.status : 400;
    const msg = e instanceof Error ? e.message : "PAT không hợp lệ";
    return NextResponse.json(
      { error: msg },
      { status: status >= 500 ? 502 : 400 },
    );
  }

  try {
    console.log('[ADO POST] Updating employee in database...');
    const updateResult = await Employee.findByIdAndUpdate(params.id, {
      adoPat: encrypt(pat),
      adoOrganization: organization,
      adoProject: project || null,
      adoEmail: email,
      adoEnabled: true,
      adoWorkItemTypes: workItemTypes,
    }, { new: true }); // Return the updated document

    // Invalidate cache when config changes
    await AdoWorkItemCache.deleteMany({ employeeId: params.id });

    console.log('[ADO POST] Update result:', updateResult ? 'Success' : 'Failed');
    console.log('[ADO POST] Updated adoEnabled:', updateResult?.adoEnabled);
    console.log('[ADO POST] Updated adoEmail:', updateResult?.adoEmail);
  } catch (dbError) {
    console.error('[ADO POST] Database update failed:', dbError);
    return NextResponse.json(
      { error: "Lỗi lưu database: " + (dbError instanceof Error ? dbError.message : "Unknown error") },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  const body = await req.json();
  const update: Record<string, unknown> = { adoEnabled: true };

  if (body.pat) {
    // Validate new PAT if provided
    const org = body.organization ?? undefined;
    try {
      await validateAdoPat(body.pat, org || "");
    } catch (e: unknown) {
      const status = e instanceof AdoError ? e.status : 400;
      const msg = e instanceof Error ? e.message : "PAT không hợp lệ";
      return NextResponse.json(
        { error: msg },
        { status: status >= 500 ? 502 : 400 },
      );
    }
    update.adoPat = encrypt(body.pat);
  }
  if (body.organization !== undefined) {
    update.adoOrganization = body.organization;
  }
  if (body.project !== undefined) {
    update.adoProject = body.project;
  }
  if (body.email !== undefined) {
    // Validate email format
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: "Email không đúng định dạng" },
          { status: 400 },
        );
      }
    }
    update.adoEmail = body.email;
  }
  const typesUpdate = normalizeTypes(body.workItemTypes);
  if (typesUpdate !== undefined) {
    update.adoWorkItemTypes = typesUpdate;
  }

  await Employee.findByIdAndUpdate(params.id, update);

  // Invalidate cache when config changes (types may have changed)
  await AdoWorkItemCache.deleteMany({ employeeId: params.id });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  await Employee.findByIdAndUpdate(params.id, {
    adoEnabled: false,
    adoPat: null,
    adoOrganization: null,
    adoProject: null,
    adoEmail: null,
    adoWorkItemTypes: [],
  });
  await AdoWorkItemCache.deleteMany({ employeeId: params.id });
  return NextResponse.json({ ok: true });
}
