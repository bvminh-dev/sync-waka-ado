import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Employee } from "@/models/Employee";
import { decrypt, encrypt } from "@/lib/crypto";
import { exchangeOAuthCode } from "@/lib/wakatime";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await connectDB();
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state)
    return NextResponse.json({ error: "Missing code/state" }, { status: 400 });
  const emp = await Employee.findById(state).lean();
  if (!emp || emp.authType !== "oauth" || !emp.clientId || !emp.clientSecret)
    return NextResponse.json({ error: "Invalid employee" }, { status: 400 });
  const clientId = decrypt(emp.clientId);
  const clientSecret = decrypt(emp.clientSecret);
  const redirectUri =
    process.env.WAKATIME_OAUTH_REDIRECT ??
    `${origin}/api/oauth/wakatime/callback`;
  try {
    const tok = await exchangeOAuthCode({
      clientId,
      clientSecret,
      redirectUri,
      code,
    });
    await Employee.findByIdAndUpdate(state, {
      accessToken: encrypt(tok.accessToken),
      refreshToken: tok.refreshToken ? encrypt(tok.refreshToken) : null,
      tokenExpiresAt: new Date(Date.now() + tok.expiresIn * 1000),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "OAuth failed";
    return NextResponse.redirect(
      `${origin}/employees/${state}?oauth_error=${encodeURIComponent(msg)}`,
    );
  }
  return NextResponse.redirect(`${origin}/employees/${state}?oauth=ok`);
}
