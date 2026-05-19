import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Employee } from "@/models/Employee";
import {
  buildAuthorizeUrl,
  getOutlookCreds,
  getRedirectUri,
  OutlookError,
} from "@/lib/outlook";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await connectDB();
  const { searchParams, origin } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  if (!employeeId) {
    return NextResponse.json({ error: "employeeId required" }, { status: 400 });
  }
  const emp = await Employee.findById(employeeId).lean();
  if (!emp) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }
  try {
    const creds = getOutlookCreds({
      authType: emp.outlookAuthType,
      clientId: emp.outlookClientId,
      clientSecret: emp.outlookClientSecret,
      tenantId: emp.outlookTenantId,
    });
    const url = buildAuthorizeUrl({
      clientId: creds.clientId,
      tenantId: creds.tenantId,
      redirectUri: getRedirectUri(origin),
      state: employeeId,
    });
    return NextResponse.redirect(url);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "OAuth config error";
    const status = e instanceof OutlookError ? e.status : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
