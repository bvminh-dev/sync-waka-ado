import { decrypt, encrypt, type EncString } from "./crypto";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const DEFAULT_SCOPE = "offline_access Calendars.Read User.Read";

export class OutlookError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface OutlookCreds {
  clientId: string;
  clientSecret: string;
  tenantId: string;
}

/**
 * Resolve OAuth app credentials. Per-employee custom creds override env defaults.
 */
export function getOutlookCreds(opts: {
  authType?: "global" | "custom" | null;
  clientId?: EncString | null;
  clientSecret?: EncString | null;
  tenantId?: string | null;
}): OutlookCreds {
  const envId = process.env.MS_CLIENT_ID;
  const envSecret = process.env.MS_CLIENT_SECRET;
  const envTenant = process.env.MS_TENANT_ID ?? "common";
  if (opts.authType === "custom" && opts.clientId && opts.clientSecret) {
    return {
      clientId: decrypt(opts.clientId),
      clientSecret: decrypt(opts.clientSecret),
      tenantId: opts.tenantId || envTenant || "common",
    };
  }
  if (!envId || !envSecret) {
    throw new OutlookError(
      500,
      "Outlook OAuth chưa được cấu hình (MS_CLIENT_ID / MS_CLIENT_SECRET trong env)",
    );
  }
  return { clientId: envId, clientSecret: envSecret, tenantId: envTenant };
}

export function getRedirectUri(reqOrigin: string): string {
  return (
    process.env.MS_OAUTH_REDIRECT ??
    `${reqOrigin}/api/oauth/microsoft/callback`
  );
}

export function buildAuthorizeUrl(opts: {
  clientId: string;
  tenantId: string;
  redirectUri: string;
  state: string;
  scope?: string;
}): string {
  const url = new URL(
    `https://login.microsoftonline.com/${opts.tenantId}/oauth2/v2.0/authorize`,
  );
  url.searchParams.set("client_id", opts.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", opts.redirectUri);
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", opts.scope ?? DEFAULT_SCOPE);
  url.searchParams.set("state", opts.state);
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

function tokenUrl(tenantId: string): string {
  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
}

export async function exchangeOAuthCode(opts: {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
  code: string;
}): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const body = new URLSearchParams({
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    code: opts.code,
    redirect_uri: opts.redirectUri,
    grant_type: "authorization_code",
    scope: DEFAULT_SCOPE,
  });
  const res = await fetch(tokenUrl(opts.tenantId), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new OutlookError(
      res.status,
      `Microsoft token exchange failed (${res.status}): ${text.slice(0, 200)}`,
    );
  }
  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!data.access_token) throw new OutlookError(500, "No access_token");
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? "",
    expiresIn: data.expires_in ?? 3600,
  };
}

export async function refreshOAuthToken(opts: {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  refreshToken: string;
}): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const body = new URLSearchParams({
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    refresh_token: opts.refreshToken,
    grant_type: "refresh_token",
    scope: DEFAULT_SCOPE,
  });
  const res = await fetch(tokenUrl(opts.tenantId), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new OutlookError(res.status, `Token refresh failed (${res.status})`);
  }
  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!data.access_token) throw new OutlookError(500, "No access_token");
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? opts.refreshToken,
    expiresIn: data.expires_in ?? 3600,
  };
}

export interface GraphEvent {
  id: string;
  subject?: string;
  bodyPreview?: string;
  start?: { dateTime: string; timeZone: string };
  end?: { dateTime: string; timeZone: string };
  isAllDay?: boolean;
  location?: { displayName?: string };
  organizer?: { emailAddress?: { name?: string; address?: string } };
  attendees?: Array<{ emailAddress?: { name?: string; address?: string } }>;
  showAs?: string;
  webLink?: string;
}

export interface EmployeeOutlookAuth {
  authType?: "global" | "custom" | null;
  clientId?: EncString | null;
  clientSecret?: EncString | null;
  tenantId?: string | null;
  accessToken?: EncString | null;
  refreshToken?: EncString | null;
  tokenExpiresAt?: Date | null;
}

export class OutlookClient {
  private emp: EmployeeOutlookAuth;
  private creds: OutlookCreds;
  private onTokenRefresh?: (
    accessToken: EncString,
    refreshToken: EncString,
    expiresAt: Date,
  ) => Promise<void>;

  constructor(
    emp: EmployeeOutlookAuth,
    onTokenRefresh?: OutlookClient["onTokenRefresh"],
  ) {
    this.emp = emp;
    this.creds = getOutlookCreds({
      authType: emp.authType,
      clientId: emp.clientId,
      clientSecret: emp.clientSecret,
      tenantId: emp.tenantId,
    });
    this.onTokenRefresh = onTokenRefresh;
  }

  private async authHeader(): Promise<string> {
    await this.ensureFreshToken();
    if (!this.emp.accessToken)
      throw new OutlookError(401, "Missing Outlook access token");
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
    const tok = await refreshOAuthToken({
      clientId: this.creds.clientId,
      clientSecret: this.creds.clientSecret,
      tenantId: this.creds.tenantId,
      refreshToken: decrypt(this.emp.refreshToken),
    });
    const access = encrypt(tok.accessToken);
    const refresh = encrypt(tok.refreshToken);
    const expiresAt = new Date(Date.now() + tok.expiresIn * 1000);
    this.emp.accessToken = access;
    this.emp.refreshToken = refresh;
    this.emp.tokenExpiresAt = expiresAt;
    await this.onTokenRefresh?.(access, refresh, expiresAt);
  }

  async fetchMe(): Promise<{ email: string; displayName: string }> {
    const res = await fetch(`${GRAPH_BASE}/me`, {
      headers: { Authorization: await this.authHeader() },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new OutlookError(res.status, `Graph /me ${res.status}`);
    }
    const data = (await res.json()) as {
      userPrincipalName?: string;
      mail?: string;
      displayName?: string;
    };
    return {
      email: data.mail ?? data.userPrincipalName ?? "",
      displayName: data.displayName ?? "",
    };
  }

  /**
   * Fetch events overlapping [start, end). Uses calendarView (handles recurrences).
   */
  async listEvents(start: Date, end: Date): Promise<GraphEvent[]> {
    const all: GraphEvent[] = [];
    const url = new URL(`${GRAPH_BASE}/me/calendarview`);
    url.searchParams.set("startDateTime", start.toISOString());
    url.searchParams.set("endDateTime", end.toISOString());
    url.searchParams.set("$top", "200");
    url.searchParams.set(
      "$select",
      "id,subject,bodyPreview,start,end,isAllDay,location,organizer,attendees,showAs,webLink",
    );
    url.searchParams.set("$orderby", "start/dateTime");
    let next: string | null = url.toString();
    while (next) {
      const res: Response = await fetch(next, {
        headers: {
          Authorization: await this.authHeader(),
          Prefer: 'outlook.timezone="UTC"',
        },
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new OutlookError(
          res.status,
          `Graph calendarview ${res.status}: ${body.slice(0, 200)}`,
        );
      }
      const json = (await res.json()) as {
        value?: GraphEvent[];
        "@odata.nextLink"?: string;
      };
      if (json.value) all.push(...json.value);
      next = json["@odata.nextLink"] ?? null;
    }
    return all;
  }
}

/**
 * Convert a Graph event start/end (UTC-forced via Prefer header) to JS Date.
 */
export function parseGraphDate(d?: {
  dateTime: string;
  timeZone: string;
}): Date {
  if (!d) return new Date(0);
  // dateTime from Graph has no trailing Z but is UTC when Prefer="outlook.timezone='UTC'"
  const s = d.dateTime.endsWith("Z") ? d.dateTime : `${d.dateTime}Z`;
  return new Date(s);
}
