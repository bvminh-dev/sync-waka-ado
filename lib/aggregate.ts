import { connectDB } from "./mongodb";
import { DailySummary } from "@/models/DailySummary";
import { Employee } from "@/models/Employee";

export interface ProjectAggregate {
  project: string;
  totalSeconds: number;
  people: PersonAggregate[];
}

export interface PersonAggregate {
  employeeId: string;
  name: string;
  totalSeconds: number;
  branches: { name: string; totalSeconds: number }[];
}

export async function aggregateDashboard(start: string, end: string) {
  await connectDB();
  const employees = await Employee.find({}, { name: 1 }).lean();
  const empById = new Map(employees.map((e) => [String(e._id), e.name]));

  const summaries = await DailySummary.find({
    date: { $gte: start, $lte: end },
  }).lean();

  // project -> employeeId -> { totalSeconds, branches Map<name, sec> }
  const map = new Map<
    string,
    Map<string, { total: number; branches: Map<string, number> }>
  >();

  let totalSeconds = 0;
  for (const s of summaries) {
    totalSeconds += s.totalSeconds;
    const empKey = String(s.employeeId);
    for (const p of s.projects ?? []) {
      const projectMap = map.get(p.name) ?? new Map();
      const personEntry = projectMap.get(empKey) ?? {
        total: 0,
        branches: new Map<string, number>(),
      };
      personEntry.total += p.totalSeconds;
      for (const b of p.branches ?? []) {
        personEntry.branches.set(
          b.name,
          (personEntry.branches.get(b.name) ?? 0) + b.totalSeconds,
        );
      }
      projectMap.set(empKey, personEntry);
      map.set(p.name, projectMap);
    }
  }

  const projects: ProjectAggregate[] = [];
  for (const [project, peopleMap] of map.entries()) {
    const people: PersonAggregate[] = [];
    let pTotal = 0;
    for (const [empKey, v] of peopleMap.entries()) {
      pTotal += v.total;
      people.push({
        employeeId: empKey,
        name: empById.get(empKey) ?? "(unknown)",
        totalSeconds: v.total,
        branches: Array.from(v.branches.entries())
          .map(([name, totalSeconds]) => ({ name, totalSeconds }))
          .sort((a, b) => b.totalSeconds - a.totalSeconds),
      });
    }
    people.sort((a, b) => b.totalSeconds - a.totalSeconds);
    projects.push({ project, totalSeconds: pTotal, people });
  }
  projects.sort((a, b) => b.totalSeconds - a.totalSeconds);

  return {
    range: { start, end },
    totalSeconds,
    employeeCount: employees.length,
    projectCount: projects.length,
    projects,
  };
}
