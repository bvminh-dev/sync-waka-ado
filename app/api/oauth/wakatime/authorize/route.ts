import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Employee } from "@/models/Employee";
import { decrypt } from "@/lib/crypto";
import { buildAuthorizeUrl } from "@/lib/wakatime";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  if (!employeeId)
    return NextResponse.json(
      { error: "employeeId required" },
      { status: 400 },
    );
  const emp = await Employee.findById(employeeId).lean();
  if (!emp || emp.authType !== "oauth" || !emp.clientId)
    return NextResponse.json(
      { error: "Employee không hợp lệ" },
      { status: 400 },
    );
  const clientId = decrypt(emp.clientId);
  const redirect =
    process.env.WAKATIME_OAUTH_REDIRECT ??
    `${new URL(req.url).origin}/api/oauth/wakatime/callback`;
  const url = buildAuthorizeUrl({
    clientId,
    redirectUri: redirect,
    state: employeeId,
  });
  return NextResponse.redirect(url);
}
