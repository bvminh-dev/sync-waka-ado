import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Employee } from "@/models/Employee";
import { encrypt } from "@/lib/crypto";
import { validateApiKey, WakaTimeError } from "@/lib/wakatime";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectDB();
  const list = await Employee.find(
    {},
    {
      name: 1,
      authType: 1,
      tokenExpiresAt: 1,
      accessToken: 1,
      createdAt: 1,
    },
  )
    .sort({ createdAt: -1 })
    .lean();
  const out = list.map((e) => ({
    _id: String(e._id),
    name: e.name,
    authType: e.authType,
    oauthAuthorized: !!e.accessToken,
    createdAt: e.createdAt,
  }));
  return NextResponse.json({ employees: out });
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  const { name, authType, apiKey, clientId, clientSecret } = body ?? {};
  if (!name || !authType)
    return NextResponse.json(
      { error: "name & authType bắt buộc" },
      { status: 400 },
    );
  const doc: Record<string, unknown> = { name, authType };
  if (authType === "api_key") {
    if (!apiKey)
      return NextResponse.json({ error: "apiKey bắt buộc" }, { status: 400 });
    try {
      await validateApiKey(apiKey);
    } catch (e: unknown) {
      const status = e instanceof WakaTimeError ? e.status : 400;
      const msg = e instanceof Error ? e.message : "API key không hợp lệ";
      return NextResponse.json({ error: msg }, { status: status >= 500 ? 502 : 400 });
    }
    doc.apiKey = encrypt(apiKey);
  } else if (authType === "oauth") {
    if (!clientId || !clientSecret)
      return NextResponse.json(
        { error: "clientId & clientSecret bắt buộc" },
        { status: 400 },
      );
    doc.clientId = encrypt(clientId);
    doc.clientSecret = encrypt(clientSecret);
  } else {
    return NextResponse.json(
      { error: "authType không hợp lệ" },
      { status: 400 },
    );
  }
  const created = await Employee.create(doc);
  return NextResponse.json({ _id: String(created._id) }, { status: 201 });
}
