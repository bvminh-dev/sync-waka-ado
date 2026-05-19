import { connectDB } from "./mongodb";
import { DailySummary } from "@/models/DailySummary";
import { Employee } from "@/models/Employee";
import { AdoWorkItemCache } from "@/models/AdoWorkItemCache";
import { buildAdoHtmlUrl } from "./ado";

export interface WorkItemPersonTime {
  employeeId: string;
  name: string;
  totalSeconds: number;
  branches: string[];
}

export interface WorkItemTimeAggregate {
  workItemId: number;
  title: string | null;
  state: string | null;
  type: string | null;
  htmlUrl: string | null;
  totalSeconds: number;
  people: WorkItemPersonTime[];
}

export async function aggregateWorkItemTime(
  start: string,
  end: string,
  employeeId?: string,
) {
  await connectDB();

  const employees = await Employee.find(
    {},
    { name: 1, adoOrganization: 1, adoProject: 1 },
  ).lean();
  const empById = new Map(
    employees.map((e) => [
      String(e._id),
      {
        name: e.name,
        adoOrganization: e.adoOrganization as string | undefined,
        adoProject: e.adoProject as string | undefined,
      },
    ]),
  );

  const filter: Record<string, unknown> = {
    date: { $gte: start, $lte: end },
  };
  if (employeeId) filter.employeeId = employeeId;

  const summaries = await DailySummary.find(filter).lean();

  // workItemId -> employeeId -> { totalSeconds, branches Set }
  const map = new Map<
    number,
    Map<string, { total: number; branches: Set<string> }>
  >();

  let totalSeconds = 0;

  for (const s of summaries) {
    const empKey = String(s.employeeId);
    for (const p of s.projects ?? []) {
      for (const b of p.branches ?? []) {
        const wiId = (b as { adoWorkItemId?: number | null }).adoWorkItemId;
        if (wiId == null) continue;

        totalSeconds += b.totalSeconds;

        let personMap = map.get(wiId);
        if (!personMap) {
          personMap = new Map();
          map.set(wiId, personMap);
        }

        let person = personMap.get(empKey);
        if (!person) {
          person = { total: 0, branches: new Set() };
          personMap.set(empKey, person);
        }

        person.total += b.totalSeconds;
        person.branches.add(b.name);
      }
    }
  }

  const workItemIds = Array.from(map.keys());

  const cached = await AdoWorkItemCache.find({
    workItemId: { $in: workItemIds },
  }).lean();
  const cacheById = new Map(cached.map((c) => [c.workItemId, c]));

  const workItems: WorkItemTimeAggregate[] = [];

  for (const [wiId, personMap] of map.entries()) {
    const cache = cacheById.get(wiId);

    let htmlUrl: string | null = null;
    if (cache) {
      const emp = empById.get(String(cache.employeeId));
      if (emp?.adoOrganization) {
        htmlUrl = buildAdoHtmlUrl(emp.adoOrganization, emp.adoProject ?? null, wiId);
      }
    }
    if (!htmlUrl) {
      for (const [, emp] of empById) {
        if (emp.adoOrganization) {
          htmlUrl = buildAdoHtmlUrl(emp.adoOrganization, emp.adoProject ?? null, wiId);
          break;
        }
      }
    }

    const people: WorkItemPersonTime[] = [];
    let wiTotal = 0;

    for (const [empKey, v] of personMap.entries()) {
      wiTotal += v.total;
      people.push({
        employeeId: empKey,
        name: empById.get(empKey)?.name ?? "(unknown)",
        totalSeconds: v.total,
        branches: Array.from(v.branches),
      });
    }

    people.sort((a, b) => b.totalSeconds - a.totalSeconds);

    workItems.push({
      workItemId: wiId,
      title: cache?.title ?? null,
      state: cache?.state ?? null,
      type: cache?.type ?? null,
      htmlUrl,
      totalSeconds: wiTotal,
      people,
    });
  }

  workItems.sort((a, b) => b.totalSeconds - a.totalSeconds);

  return {
    range: { start, end },
    totalSeconds,
    workItemCount: workItems.length,
    workItems,
  };
}
