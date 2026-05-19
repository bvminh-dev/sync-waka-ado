"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatHours } from "@/lib/format";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import type { RangePreset } from "@/lib/ranges";

interface PersonTime {
  employeeId: string;
  name: string;
  totalSeconds: number;
  branches: string[];
}

interface WorkItemTime {
  workItemId: number;
  title: string | null;
  state: string | null;
  type: string | null;
  htmlUrl: string | null;
  totalSeconds: number;
  people: PersonTime[];
}

interface AdoTimeDashData {
  range: { start: string; end: string };
  totalSeconds: number;
  workItemCount: number;
  workItems: WorkItemTime[];
}

const stateColors: Record<string, string> = {
  New: "bg-gray-100 text-gray-700",
  Active: "bg-blue-100 text-blue-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Resolved: "bg-green-100 text-green-700",
  Closed: "bg-gray-100 text-gray-500",
  Done: "bg-green-100 text-green-700",
};

const typeColors: Record<string, string> = {
  Bug: "bg-red-50 text-red-600",
  Task: "bg-blue-50 text-blue-600",
  "User Story": "bg-purple-50 text-purple-600",
  Feature: "bg-green-50 text-green-600",
  Epic: "bg-orange-50 text-orange-600",
};

export function WorkItemTimeSummary({ preset }: { preset: RangePreset }) {
  const [data, setData] = useState<AdoTimeDashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/ado?preset=${preset}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [preset]);

  if (loading) {
    return (
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-primary-dark">
          Thời gian theo Work Item
        </h2>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!data || data.workItems.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-primary-dark">
          Thời gian theo Work Item
        </h2>
        <div className="flex items-center gap-3 text-sm text-ink-500">
          <span>{data.workItemCount} tickets</span>
          <span className="font-semibold text-primary">
            {formatHours(data.totalSeconds)}
          </span>
        </div>
      </div>

      {data.workItems.map((wi) => {
        const open = expanded[wi.workItemId] ?? false;
        return (
          <Card key={wi.workItemId}>
            <button
              onClick={() =>
                setExpanded((s) => ({
                  ...s,
                  [wi.workItemId]: !open,
                }))
              }
              className="w-full text-left p-5 sm:p-6 flex items-center justify-between hover:bg-surface-cyan/30 rounded-xl transition"
            >
              <div className="flex items-center gap-3 min-w-0 flex-wrap">
                {open ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
                <span className="text-sm font-mono text-ink-400">
                  #{wi.workItemId}
                </span>
                <span className="font-semibold text-primary-dark text-lg truncate">
                  {wi.title ?? `Work Item #${wi.workItemId}`}
                </span>
                {wi.type && (
                  <Badge
                    className={
                      typeColors[wi.type] ?? "bg-gray-50 text-gray-600"
                    }
                  >
                    {wi.type}
                  </Badge>
                )}
                {wi.state && (
                  <Badge
                    className={
                      stateColors[wi.state] ?? "bg-gray-100 text-gray-700"
                    }
                  >
                    {wi.state}
                  </Badge>
                )}
                {wi.htmlUrl && (
                  <a
                    href={wi.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-ink-400 hover:text-primary"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
              <span className="font-bold text-primary shrink-0 ml-3">
                {formatHours(wi.totalSeconds)}
              </span>
            </button>
            {open && (
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-3">
                {wi.people.map((person) => (
                  <div
                    key={person.employeeId}
                    className="border border-line-soft rounded-lg p-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-ink-800">
                        {person.name}
                      </span>
                      <span className="text-sm text-primary-muted font-semibold">
                        {formatHours(person.totalSeconds)}
                      </span>
                    </div>
                    {person.branches.length > 0 && (
                      <ul className="mt-2 text-sm text-ink-700 flex flex-wrap gap-x-4 gap-y-1">
                        {person.branches.map((b) => (
                          <li key={b} className="flex gap-1">
                            <span className="text-ink-400">⎇</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
