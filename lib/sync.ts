import { connectDB } from "./mongodb";
import { Employee } from "@/models/Employee";
import { DailySummary } from "@/models/DailySummary";
import { WakaTimeClient, type WakaDayRaw } from "./wakatime";
import { encrypt, type EncString } from "./crypto";
import { extractAdoWorkItemId } from "./branch-utils";

/**
 * Fetch summaries from WakaTime for the given range and upsert per-day cache.
 * Also fetches per-project branch breakdown for each project that appears.
 * Returns the upserted DailySummary documents.
 */
export async function syncEmployeeRange(
  employeeId: string,
  start: string,
  end: string,
) {
  await connectDB();
  const emp = await Employee.findById(employeeId).lean();
  if (!emp) throw new Error("Employee not found");
  if (!emp.authType) throw new Error("Employee chưa cấu hình WakaTime");

  const client = new WakaTimeClient(
    {
      _id: String(emp._id),
      authType: emp.authType,
      apiKey: emp.apiKey ?? undefined,
      clientId: emp.clientId ?? undefined,
      clientSecret: emp.clientSecret ?? undefined,
      accessToken: emp.accessToken ?? undefined,
      refreshToken: emp.refreshToken ?? undefined,
      tokenExpiresAt: emp.tokenExpiresAt ?? undefined,
    },
    async (access, refresh, expiresAt) => {
      await Employee.findByIdAndUpdate(employeeId, {
        accessToken: access,
        refreshToken: refresh,
        tokenExpiresAt: expiresAt,
      });
    },
  );

  const days = await client.fetchSummaries(start, end);

  // Collect unique project names across the range
  const projectNames = new Set<string>();
  for (const d of days) for (const p of d.projects) projectNames.add(p.name);

  // Per-project branch summaries indexed by date
  const branchesByProjectAndDate = new Map<string, Map<string, BranchEntry[]>>();
  for (const projectName of projectNames) {
    try {
      const pDays = await client.fetchSummaries(start, end, projectName);
      const inner = new Map<string, BranchEntry[]>();
      for (const d of pDays) {
        const entries: BranchEntry[] = (d.branches ?? []).map((b) => ({
          name: b.name,
          totalSeconds: Math.round(b.total_seconds),
          adoWorkItemId: extractAdoWorkItemId(b.name),
        }));
        inner.set(d.range.date, entries);
      }
      branchesByProjectAndDate.set(projectName, inner);
    } catch {
      // ignore per-project failures so other projects still cache
    }
  }

  const docs: DailySummaryInsert[] = days.map((d) => ({
    date: d.range.date,
    totalSeconds: Math.round(d.grand_total.total_seconds),
    projects: d.projects.map((p) => ({
      name: p.name,
      totalSeconds: Math.round(p.total_seconds),
      branches: branchesByProjectAndDate.get(p.name)?.get(d.range.date) ?? [],
    })),
  }));

  for (const doc of docs) {
    await DailySummary.findOneAndUpdate(
      { employeeId, date: doc.date },
      { ...doc, employeeId, fetchedAt: new Date() },
      { upsert: true, new: true },
    );
  }

  return docs;
}

interface BranchEntry {
  name: string;
  totalSeconds: number;
  adoWorkItemId: number | null;
}

interface DailySummaryInsert {
  date: string;
  totalSeconds: number;
  projects: {
    name: string;
    totalSeconds: number;
    branches: BranchEntry[];
  }[];
}
