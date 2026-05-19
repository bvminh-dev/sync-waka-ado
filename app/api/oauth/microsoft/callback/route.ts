import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Employee } from "@/models/Employee";
import { encrypt } from "@/lib/crypto";
import {
  exchangeOAuthCode,
  getOutlookCreds,
  getRedirectUri,
  OutlookClient,
} from "@/lib/outlook";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await connectDB();
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errParam = searchParams.get("error_description") ?? searchParams.get("error");
  if (errParam) {
    return NextResponse.redirect(
      `${origin}/employees/${state ?? ""}?outlook_error=${encodeURIComponent(errParam)}`,
    );
  }
  if (!code || !state) {
    return NextResponse.json({ error: "Missing code/state" }, { status: 400 });
  }
  const emp = await Employee.findById(state).lean();
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
    const tok = await exchangeOAuthCode({
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      tenantId: creds.tenantId,
      redirectUri: getRedirectUri(origin),
      code,
    });
    const accessToken = encrypt(tok.accessToken);
    const refreshToken = tok.refreshToken ? encrypt(tok.refreshToken) : null;
    const expiresAt = new Date(Date.now() + tok.expiresIn * 1000);

    // Fetch email via /me
    let outlookEmail: string | null = null;
    try {
      const client = new OutlookClient({
        authType: emp.outlookAuthType,
        clientId: emp.outlookClientId,
        clientSecret: emp.outlookClientSecret,
        tenantId: emp.outlookTenantId,
        accessToken,
        refreshToken,
        tokenExpiresAt: expiresAt,
      });
      const me = await client.fetchMe();
      outlookEmail = me.email || null;
    } catch {
      // non-fatal — token still valid
    }

    await Employee.findByIdAndUpdate(state, {
      outlookEnabled: true,
      outlookAccessToken: accessToken,
      outlookRefreshToken: refreshToken,
      outlookTokenExpiresAt: expiresAt,
      outlookEmail,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "OAuth failed";
    return NextResponse.redirect(
      `${origin}/employees/${state}?outlook_error=${encodeURIComponent(msg)}`,
    );
  }
  return NextResponse.redirect(`${origin}/employees/${state}?outlook=ok`);
}
