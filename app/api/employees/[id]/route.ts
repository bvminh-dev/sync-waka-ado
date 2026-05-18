import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Employee } from "@/models/Employee";
import { DailySummary } from "@/models/DailySummary";
import { encrypt } from "@/lib/crypto";
import { validateApiKey, WakaTimeError } from "@/lib/wakatime";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  const e = await Employee.findById(params.id).lean();
  if (!e) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    _id: String(e._id),
    name: e.name,
    authType: e.authType,
    oauthAuthorized: !!e.accessToken,
    tokenExpiresAt: e.tokenExpiresAt,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  const body = await req.json();
  const update: Record<string, unknown> = {};
  if (body.name) update.name = body.name;
  if (body.apiKey) {
    try {
      await validateApiKey(body.apiKey);
    } catch (e: unknown) {
      const status = e instanceof WakaTimeError ? e.status : 400;
      const msg = e instanceof Error ? e.message : "API key không hợp lệ";
      return NextResponse.json(
        { error: msg },
        { status: status >= 500 ? 502 : 400 },
      );
    }
    update.apiKey = encrypt(body.apiKey);
  }
  if (body.clientId) update.clientId = encrypt(body.clientId);
  if (body.clientSecret) update.clientSecret = encrypt(body.clientSecret);
  await Employee.findByIdAndUpdate(params.id, update);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  await Employee.findByIdAndDelete(params.id);
  await DailySummary.deleteMany({ employeeId: params.id });
  return NextResponse.json({ ok: true });
}
