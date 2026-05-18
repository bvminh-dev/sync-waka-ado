import { decrypt, encrypt, type EncString } from "./crypto";

const WAKA_BASE = "https://wakatime.com/api/v1";
const WAKA_TOKEN_URL = "https://wakatime.com/oauth/token";

export interface WakaProjectBranchEntry {
  name: string;
  total_seconds: number;
}

export interface WakaDaySummary {
  date: string; // YYYY-MM-DD
  totalSeconds: number;
  projects: { name: string; totalSeconds: number }[];
}

export interface ProjectBranchSummary {
  name: string;
  totalSeconds: number;
}

export interface EmployeeAuth {
  _id: string;
  authType: "api_key" | "oauth";
  apiKey?: EncString;
  clientId?: EncString;
  clientSecret?: EncString;
  accessToken?: EncString;
  refreshToken?: EncString;
  tokenExpiresAt?: Date;
}

export class WakaTimeError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Lightweight WakaTime client. Supports api_key (Basic auth) and OAuth2 (Bearer).
 * OAuth refresh persistence happens via the optional onTokenRefresh callback.
 */
export class WakaTimeClient {
  private emp: EmployeeAuth;
  private onTokenRefresh?: (
    accessToken: EncString,
    refreshToken: EncString,
    expiresAt: Date,
  ) => Promise<void>;

  constructor(
    emp: EmployeeAuth,
    onTokenRefresh?: WakaTimeClient["onTokenRefresh"],
  ) {
    this.emp = emp;
    this.onTokenRefresh = onTokenRefresh;
  }

  private async authHeader(): Promise<string> {
    if (this.emp.authType === "api_key") {
      if (!this.emp.apiKey) throw new WakaTimeError(400, "Missing api key");
      const key = decrypt(this.emp.apiKey);
      return `Basic ${Buffer.from(key).toString("base64")}`;
    }
    // oauth
    await this.ensureFreshToken();
    if (!this.emp.accessToken)
      throw new WakaTimeError(401, "Missing access token");
    return `Bearer ${decrypt(this.emp.accessToken)}`;
  }

  private async ensureFreshToken() {
    if (!this.emp.accessToken || !this.emp.refreshToken) return;
    if (
      this.emp.tokenExpiresAt &&
      new Date(this.emp.tokenExpiresAt).getTime() - Date.now() > 60_000
    ) {
      return;
    }
    if (!this.emp.clientId || !this.emp.clientSecret) return;
    const body = new URLSearchParams({
      client_id: decrypt(this.emp.clientId),
      client_secret: decrypt(this.emp.clientSecret),
      grant_type: "refresh_token",
      refresh_token: decrypt(this.emp.refreshToken),
    });
    const res = await fetch(WAKA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      throw new WakaTimeError(res.status, `Token refresh failed: ${res.status}`);
    }
    const text = await res.text();
    const data = parseTokenResponse(text);
    const access = encrypt(data.access_token);
    const refresh = encrypt(data.refresh_token ?? decrypt(this.emp.refreshToken));
    const expiresAt = new Date(Date.now() + (data.expires_in ?? 3600) * 1000);
    this.emp.accessToken = access;
    this.emp.refreshToken = refresh;
    this.emp.tokenExpiresAt = expiresAt;
    await this.onTokenRefresh?.(access, refresh, expiresAt);
  }

  /** Fetch daily summaries between start..end inclusive. */
  async fetchSummaries(
    start: string,
    end: string,
    project?: string,
  ): Promise<WakaDayRaw[]> {
    const url = new URL(`${WAKA_BASE}/users/current/summaries`);
    url.searchParams.set("start", start);
    url.searchParams.set("end", end);
    if (project) url.searchParams.set("project", project);
    const res = await fetch(url, {
      headers: { Authorization: await this.authHeader() },
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new WakaTimeError(
        res.status,
        `WakaTime summaries ${res.status}: ${body.slice(0, 200)}`,
      );
    }
    const json = (await res.json()) as { data?: WakaDayRaw[] };
    return json.data ?? [];
  }
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

function parseTokenResponse(text: string): TokenResponse {
  // WakaTime returns either form-encoded or json depending on Accept header
  if (text.trim().startsWith("{")) return JSON.parse(text);
  const params = new URLSearchParams(text);
  return {
    access_token: params.get("access_token") ?? "",
    refresh_token: params.get("refresh_token") ?? undefined,
    expires_in: params.get("expires_in")
      ? Number(params.get("expires_in"))
      : undefined,
    token_type: params.get("token_type") ?? undefined,
  };
}

export interface WakaDayRaw {
  range: { date: string; start: string; end: string };
  grand_total: { total_seconds: number };
  projects: Array<{ name: string; total_seconds: number }>;
  branches?: Array<{ name: string; total_seconds: number }>;
}

export async function exchangeOAuthCode(opts: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const body = new URLSearchParams({
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    redirect_uri: opts.redirectUri,
    grant_type: "authorization_code",
    code: opts.code,
  });
  const res = await fetch(WAKA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new WakaTimeError(
      res.status,
      `WakaTime token exchange failed (${res.status})`,
    );
  }
  const text = await res.text();
  const data = parseTokenResponse(text);
  if (!data.access_token) throw new WakaTimeError(500, "No access_token");
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? "",
    expiresIn: data.expires_in ?? 3600,
  };
}

/**
 * Validate a raw WakaTime API key by calling /users/current.
 * Returns the user display name on success; throws WakaTimeError otherwise.
 */
export async function validateApiKey(apiKey: string): Promise<string> {
  if (!apiKey || apiKey.trim().length < 8) {
    throw new WakaTimeError(400, "API key trông không hợp lệ");
  }
  const res = await fetch(`${WAKA_BASE}/users/current`, {
    headers: {
      Authorization: `Basic ${Buffer.from(apiKey.trim()).toString("base64")}`,
    },
    cache: "no-store",
  });
  if (res.status === 401) {
    throw new WakaTimeError(401, "API key WakaTime không đúng hoặc đã bị thu hồi");
  }
  if (!res.ok) {
    throw new WakaTimeError(
      res.status,
      `Không xác thực được với WakaTime (${res.status})`,
    );
  }
  const json = (await res.json().catch(() => null)) as
    | { data?: { display_name?: string; username?: string } }
    | null;
  return (
    json?.data?.display_name ?? json?.data?.username ?? "WakaTime user"
  );
}

export function buildAuthorizeUrl(opts: {
  clientId: string;
  redirectUri: string;
  state: string;
  scope?: string;
}): string {
  const url = new URL("https://wakatime.com/oauth/authorize");
  url.searchParams.set("client_id", opts.clientId);
  url.searchParams.set("redirect_uri", opts.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", opts.state);
  url.searchParams.set(
    "scope",
    opts.scope ?? "email,read_stats,read_summaries",
  );
  return url.toString();
}
