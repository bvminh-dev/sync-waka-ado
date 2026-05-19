import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Employee } from "@/models/Employee";
import { encrypt } from "@/lib/crypto";
import { CalendarEvent } from "@/models/CalendarEvent";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  const emp = await Employee.findById(params.id).lean();
  if (!emp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    outlookEnabled: emp.outlookEnabled ?? false,
    outlookAuthType: emp.outlookAuthType ?? null,
    hasCustomCreds: !!(emp.outlookClientId && emp.outlookClientSecret),
    outlookEmail: emp.outlookEmail ?? null,
    outlookTenantId: emp.outlookTenantId ?? null,
    oauthAuthorized: !!emp.outlookAccessToken,
    tokenExpiresAt: emp.outlookTokenExpiresAt ?? null,
  });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  const body = await req.json();
  const authType: "global" | "custom" =
    body.authType === "custom" ? "custom" : "global";
  const update: Record<string, unknown> = {
    outlookEnabled: true,
    outlookAuthType: authType,
  };
  if (authType === "custom") {
    if (body.clientId) update.outlookClientId = encrypt(String(body.clientId));
    if (body.clientSecret)
      update.outlookClientSecret = encrypt(String(body.clientSecret));
    if (body.tenantId !== undefined)
      update.outlookTenantId = body.tenantId || null;
  } else {
    update.outlookClientId = null;
    update.outlookClientSecret = null;
    update.outlookTenantId = null;
  }
  await Employee.findByIdAndUpdate(params.id, update);
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  const body = await req.json();
  const update: Record<string, unknown> = {};
  if (body.authType === "custom" || body.authType === "global") {
    update.outlookAuthType = body.authType;
  }
  if (body.clientId) update.outlookClientId = encrypt(String(body.clientId));
  if (body.clientSecret)
    update.outlookClientSecret = encrypt(String(body.clientSecret));
  if (body.tenantId !== undefined) update.outlookTenantId = body.tenantId || null;
  await Employee.findByIdAndUpdate(params.id, update);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  await Employee.findByIdAndUpdate(params.id, {
    outlookEnabled: false,
    outlookAccessToken: null,
    outlookRefreshToken: null,
    outlookTokenExpiresAt: null,
    outlookEmail: null,
  });
  await CalendarEvent.deleteMany({ employeeId: params.id });
  return NextResponse.json({ ok: true });
}
