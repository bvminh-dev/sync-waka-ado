import { decrypt, type EncString } from "./crypto";

const ADO_BASE = (org: string) => `https://dev.azure.com/${org}`;
const ADO_API_VERSION = "7.0";

export interface AdoAuth {
  pat: EncString;
  organization: string;
  project?: string;
}

export interface AdoWorkItem {
  id: number;
  url: string;
  rev: number;
  fields: {
    "System.Id": number;
    "System.Title": string;
    "System.State": string;
    "System.WorkItemType": string;
    "System.AssignedTo":
      | { displayName: string; uniqueName: string }
      | null;
    "System.CreatedDate": string;
    "System.ChangedDate": string;
    "Microsoft.VSTS.Scheduling.RemainingWork": number | null;
    "Microsoft.VSTS.Scheduling.CompletedWork": number | null;
    "Microsoft.VSTS.Scheduling.StartTime": string | null;
    "System.TeamProject": string;
  };
}

export interface AdoWorkItemDisplay {
  id: number;
  url: string;
  title: string;
  state: string;
  type: string;
  assignedTo?: string | null;
  createdDate: string;
  remainingWork: number | null;
  completedWork: number | null;
  startTime: string | null;
  rev: number;
}

export interface AdoWiqlResult {
  workItems: Array<{ id: number; url: string }>;
}

export interface AdoProcess {
  id: string;
  name: string;
  description: string;
  url: string;
}

export interface AdoWorkItemType {
  name: string;
  referenceName: string;
  description: string;
}

export interface AdoState {
  name: string;
  color: string;
  stateType: string;
}

export class AdoError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "AdoError";
  }
}

/**
 * Azure DevOps REST API client.
 * Uses Personal Access Token (PAT) for authentication via Basic auth.
 */
export class AdoClient {
  private auth: AdoAuth;

  constructor(auth: AdoAuth) {
    this.auth = auth;
  }

  private getBaseUrl(): string {
    return ADO_BASE(this.auth.organization);
  }

  private getHeaders(): Record<string, string> {
    const pat = decrypt(this.auth.pat);
    const b64 = Buffer.from(`:${pat}`).toString("base64");
    return {
      "Authorization": `Basic ${b64}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: { ...this.getHeaders(), ...options?.headers },
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new AdoError(
        res.status,
        `ADO API error ${res.status}: ${body.slice(0, 200)}`,
      );
    }
    return res.json();
  }

  /**
   * Validate PAT by fetching current user info.
   */
  async validatePat(): Promise<{ displayName: string; emailAddress: string }> {
    try {
      // Use projects endpoint to validate PAT (simpler and more reliable)
      await this.request<{ value: any[] }>(
        "/_apis/projects?api-version=7.0&$top=1"
      );

      // Try to get member info for better display
      try {
        const memberData = await this.request<{
          value: Array<{ displayName: string; uniqueName: string; mail?: string }>
        }>(
          "/_apis/Graph/Users?api-version=7.0-preview.1"
        );

        if (memberData.value?.length > 0) {
          const currentUser = memberData.value[0];
          return {
            displayName: currentUser.displayName || "Azure DevOps User",
            emailAddress: currentUser.mail || currentUser.uniqueName || "user@dev.azure.com"
          };
        }
      } catch {
        // Ignore member fetch errors
      }

      return {
        displayName: "Azure DevOps User",
        emailAddress: "user@dev.azure.com"
      };
    } catch (e) {
      if (e instanceof AdoError) {
        if (e.status === 401 || e.status === 403) {
          throw new AdoError(401, "PAT không đúng hoặc đã hết hạn");
        }
      }
      throw e;
    }
  }

  /**
   * Get work items assigned to user via WIQL.
   */
  async getAssignedWorkItems(assigneeEmail: string): Promise<number[]> {
    const projectClause = this.auth.project
      ? `AND [System.TeamProject] = '${this.auth.project}'`
      : "";

    const wiql = {
      query: `
        SELECT [System.Id]
        FROM WorkItems
        WHERE [System.AssignedTo] = '${assigneeEmail}'
          ${projectClause}
          AND [System.State] <> 'Closed'
          AND [System.State] <> 'Removed'
          AND [System.State] <> 'Done'
      `,
    };

    const result = await this.request<{ workItems: Array<{ id: number }> }>(
      `/_apis/wit/wiql?api-version=${ADO_API_VERSION}`,
      {
        method: "POST",
        body: JSON.stringify(wiql),
      },
    );

    return result.workItems.map((w) => w.id);
  }

  /**
   * Batch fetch work item details.
   * ADO supports max 200 IDs per request.
   */
  async getWorkItems(ids: number[]): Promise<AdoWorkItem[]> {
    if (ids.length === 0) return [];

    // Chunk into batches of 200
    const batches: number[][] = [];
    for (let i = 0; i < ids.length; i += 200) {
      batches.push(ids.slice(i, i + 200));
    }

    const results = await Promise.all(
      batches.map((batch) =>
        this.request<{ value: AdoWorkItem[] }>(
          `/_apis/wit/workitems?ids=${batch.join(",")}&api-version=${ADO_API_VERSION}&$select=System.Id,System.Title,System.State,System.WorkItemType,System.AssignedTo,System.CreatedDate,System.ChangedDate,Microsoft.VSTS.Scheduling.RemainingWork,Microsoft.VSTS.Scheduling.CompletedWork,Microsoft.VSTS.Scheduling.StartTime,System.TeamProject,System.Rev`,
        ),
      ),
    );

    return results.flatMap((r) => r.value);
  }

  /**
   * Update time tracking fields on a work item.
   */
  async updateTimeTracking(
    workItemId: number,
    updates: {
      completedWork?: number;
      remainingWork?: number;
      startTime?: string | null;
    },
  ): Promise<AdoWorkItem> {
    const patchDoc: Array<{
      op: string;
      path: string;
      value: string | number | null;
    }> = [];

    if (updates.completedWork !== undefined) {
      patchDoc.push({
        op: "add",
        path: "/fields/Microsoft.VSTS.Scheduling.CompletedWork",
        value: updates.completedWork,
      });
    }
    if (updates.remainingWork !== undefined) {
      patchDoc.push({
        op: "add",
        path: "/fields/Microsoft.VSTS.Scheduling.RemainingWork",
        value: updates.remainingWork,
      });
    }
    if (updates.startTime !== undefined) {
      if (updates.startTime === null) {
        patchDoc.push({
          op: "remove",
          path: "/fields/Microsoft.VSTS.Scheduling.StartTime",
          value: null as any,
        });
      } else {
        patchDoc.push({
          op: "add",
          path: "/fields/Microsoft.VSTS.Scheduling.StartTime",
          value: updates.startTime,
        });
      }
    }

    const project = this.auth.project || "_apis";
    return this.request<AdoWorkItem>(
      `/${project}/_apis/wit/workitems/${workItemId}?api-version=${ADO_API_VERSION}`,
      {
        method: "PATCH",
        body: JSON.stringify(patchDoc),
      },
    );
  }

  /**
   * Update work item state.
   */
  async updateWorkItemState(
    workItemId: number,
    newState: string,
  ): Promise<AdoWorkItem> {
    const patchDoc = [
      {
        op: "add",
        path: "/fields/System.State",
        value: newState,
      },
    ];

    const project = this.auth.project || "_apis";
    return this.request<AdoWorkItem>(
      `/${project}/_apis/wit/workitems/${workItemId}?api-version=${ADO_API_VERSION}`,
      {
        method: "PATCH",
        body: JSON.stringify(patchDoc),
      },
    );
  }

  /**
   * Get valid states for a work item type.
   * This requires fetching the process configuration.
   */
  async getWorkItemStates(workItemType: string): Promise<string[]> {
    try {
      // First, get all processes
      const processes = await this.request<{ value: AdoProcess[] }>(
        `/_apis/work/processes?api-version=${ADO_API_VERSION}`,
      );

      // For each process, get work item types and find matching states
      // This is expensive, so we'll cache results per work item type
      const allStates = new Set<string>();

      for (const process of processes.value) {
        try {
          const types = await this.request<{ value: AdoWorkItemType[] }>(
            `/_apis/work/processes/${process.id}/workitemtypes?api-version=${ADO_API_VERSION}`,
          );

          const type = types.value.find((t) => t.name === workItemType);
          if (type) {
            const states = await this.request<{ value: AdoState[] }>(
              `/_apis/work/processes/${process.id}/workitemtypes/${type.referenceName}/states?api-version=${ADO_API_VERSION}`,
            );
            states.value.forEach((s) => allStates.add(s.name));
            break; // Found matching type, no need to check other processes
          }
        } catch {
          // Skip processes we can't access
          continue;
        }
      }

      return Array.from(allStates);
    } catch (e) {
      // If we can't fetch states, return common defaults
      const commonStates: Record<string, string[]> = {
        Bug: ["New", "Active", "Resolved", "Closed"],
        Task: ["New", "Active", "Closed", "Removed"],
        "User Story": ["New", "Active", "Resolved", "Closed", "Removed"],
        Feature: ["New", "Active", "Resolved", "Closed"],
      };
      return commonStates[workItemType] || [
        "New",
        "Active",
        "Resolved",
        "Closed",
      ];
    }
  }

  /**
   * Convert AdoWorkItem to AdoWorkItemDisplay for UI.
   */
  toDisplay(workItem: AdoWorkItem): AdoWorkItemDisplay {
    return {
      id: workItem.id,
      url: workItem.url,
      title: workItem.fields["System.Title"],
      state: workItem.fields["System.State"],
      type: workItem.fields["System.WorkItemType"],
      assignedTo: workItem.fields["System.AssignedTo"]?.displayName || null,
      createdDate: workItem.fields["System.CreatedDate"],
      remainingWork: workItem.fields["Microsoft.VSTS.Scheduling.RemainingWork"],
      completedWork: workItem.fields["Microsoft.VSTS.Scheduling.CompletedWork"],
      startTime: workItem.fields["Microsoft.VSTS.Scheduling.StartTime"],
      rev: workItem.rev,
    };
  }
}

/**
 * Validate a raw ADO PAT string.
 * Throws AdoError if invalid.
 */
export async function validateAdoPat(
  pat: string,
  organization: string,
): Promise<{ displayName: string; emailAddress: string }> {
  if (!pat || pat.trim().length < 5) {
    throw new AdoError(400, "PAT trông không hợp lệ");
  }
  if (!organization || organization.trim().length < 2) {
    throw new AdoError(400, "Organization name trông không hợp lệ");
  }

  // Direct fetch without going through AdoClient (to avoid encryption issues)
  const b64 = Buffer.from(`:${pat.trim()}`).toString("base64");
  const url = `https://dev.azure.com/${organization.trim()}/_apis/projects?api-version=7.0&$top=1`;

  const res = await fetch(url, {
    headers: {
      "Authorization": `Basic ${b64}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new AdoError(401, "PAT không đúng hoặc không có quyền truy cập");
    }
    const body = await res.text().catch(() => "");
    throw new AdoError(res.status, `Không thể kết nối Azure DevOps (${res.status}): ${body.slice(0, 100)}`);
  }

  // Try to get member info for better display
  try {
    const memberRes = await fetch(
      `https://dev.azure.com/${organization.trim()}/_apis/Graph/Users?api-version=7.0-preview.1`,
      {
        headers: {
          "Authorization": `Basic ${b64}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        cache: "no-store",
      }
    );

    if (memberRes.ok) {
      const memberData = await memberRes.json();
      if (memberData.value?.length > 0) {
        const currentUser = memberData.value[0];
        return {
          displayName: currentUser.displayName || "Azure DevOps User",
          emailAddress: currentUser.mail || currentUser.uniqueName || "user@dev.azure.com"
        };
      }
    }
  } catch {
    // Ignore member fetch errors
  }

  return {
    displayName: "Azure DevOps User",
    emailAddress: "user@dev.azure.com"
  };
}
