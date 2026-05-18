"use client";
import { useEffect, useState, useMemo } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RangePicker } from "@/components/RangePicker";
import { HoursBarChart } from "@/components/HoursBarChart";
import { formatHours } from "@/lib/format";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import type { RangePreset } from "@/lib/ranges";

interface DashData {
  range: { start: string; end: string };
  totalSeconds: number;
  employeeCount: number;
  projectCount: number;
  projects: {
    project: string;
    totalSeconds: number;
    people: {
      employeeId: string;
      name: string;
      totalSeconds: number;
      branches: { name: string; totalSeconds: number }[];
    }[];
  }[];
}

export default function DashboardPage() {
  const [preset, setPreset] = useState<RangePreset>("week");
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function load(sync = false) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/dashboard?preset=${preset}${sync ? "&sync=1" : ""}`,
      );
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  const topProjects = useMemo(
    () =>
      (data?.projects ?? []).slice(0, 10).map((p) => ({
        name: p.project,
        totalSeconds: p.totalSeconds,
      })),
    [data],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-5xl font-semibold text-primary-dark">
            Dashboard
          </h1>
          <p className="text-ink-500 mt-1 text-sm">
            {data ? `${data.range.start} → ${data.range.end}` : "Đang tải..."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <RangePicker value={preset} onChange={setPreset} />
          <Button
            variant="secondary"
            size="sm"
            disabled={syncing}
            onClick={async () => {
              setSyncing(true);
              await load(true);
              setSyncing(false);
            }}
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            Sync WakaTime
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Tổng giờ"
          value={data ? formatHours(data.totalSeconds) : null}
        />
        <KpiCard
          title="Nhân sự"
          value={data ? String(data.employeeCount) : null}
        />
        <KpiCard
          title="Project"
          value={data ? String(data.projectCount) : null}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top projects (giờ)</CardTitle>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <HoursBarChart data={topProjects} />
          )}
        </CardBody>
      </Card>

      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-primary-dark">
          Chi tiết theo project
        </h2>
        {loading && <Skeleton className="h-32 w-full" />}
        {!loading && !data?.projects.length && (
          <Card>
            <CardBody>
              <div className="text-center text-ink-400 py-8">
                Chưa có dữ liệu. Hãy bấm <strong>Sync WakaTime</strong> để kéo
                dữ liệu cho khoảng đã chọn.
              </div>
            </CardBody>
          </Card>
        )}
        {data?.projects.map((p) => {
          const open = expanded[p.project] ?? false;
          return (
            <Card key={p.project}>
              <button
                onClick={() =>
                  setExpanded((s) => ({ ...s, [p.project]: !open }))
                }
                className="w-full text-left p-5 sm:p-6 flex items-center justify-between hover:bg-surface-cyan/30 rounded-xl transition"
              >
                <div className="flex items-center gap-3">
                  {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <span className="font-semibold text-primary-dark text-lg">
                    {p.project}
                  </span>
                  <Badge>{p.people.length} người</Badge>
                </div>
                <span className="font-bold text-primary">
                  {formatHours(p.totalSeconds)}
                </span>
              </button>
              {open && (
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-3">
                  {p.people.map((person) => (
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
                            <li key={b.name} className="flex gap-1">
                              <span className="text-ink-400">⎇</span>
                              <span>{b.name}</span>
                              <span className="text-ink-400">·</span>
                              <span>{formatHours(b.totalSeconds)}</span>
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
    </div>
  );
}

function KpiCard({ title, value }: { title: string; value: string | null }) {
  return (
    <Card>
      <CardBody>
        <div className="text-sm uppercase tracking-wide text-ink-500 mb-1">
          {title}
        </div>
        {value === null ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <div className="text-3xl font-semibold text-primary-dark">{value}</div>
        )}
      </CardBody>
    </Card>
  );
}
