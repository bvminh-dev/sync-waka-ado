"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HoursBarChart } from "@/components/HoursBarChart";
import { UpdateApiKeyDialog } from "@/components/EmployeeForm";
import { formatHours } from "@/lib/format";
import { todayStr } from "@/lib/ranges";
import {
  ArrowLeft,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

interface EmpDetail {
  _id: string;
  name: string;
  authType: "api_key" | "oauth";
  oauthAuthorized: boolean;
}

interface Summary {
  date: string;
  totalSeconds: number;
  projects: {
    name: string;
    totalSeconds: number;
    branches: { name: string; totalSeconds: number }[];
  }[];
}

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();
  const oauthErr = sp.get("oauth_error");
  const oauthOk = sp.get("oauth");
  const [emp, setEmp] = useState<EmpDetail | null>(null);
  const [date, setDate] = useState(todayStr());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const reloadEmp = () =>
    fetch(`/api/employees/${params.id}`)
      .then((r) => r.json())
      .then(setEmp);

  useEffect(() => {
    reloadEmp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function load(refresh = false) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/employees/${params.id}/summary?date=${date}${refresh ? "&refresh=1" : ""}`,
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "Không thể đồng bộ với WakaTime");
        setSummary(null);
      } else {
        setError(null);
        setSummary(json);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, params.id]);

  return (
    <div className="space-y-6">
      <Link
        href="/employees"
        className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
      >
        <ArrowLeft size={14} /> Tất cả nhân sự
      </Link>

      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {emp ? (
                <>
                  <h1 className="text-3xl sm:text-4xl font-semibold text-primary-dark">
                    {emp.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge>
                      {emp.authType === "api_key" ? "API Key" : "OAuth2"}
                    </Badge>
                    {emp.authType === "oauth" && !emp.oauthAuthorized && (
                      <a
                        href={`/api/oauth/wakatime/authorize?employeeId=${emp._id}`}
                        className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-pill bg-accent text-white hover:bg-accent-hover"
                      >
                        Authorize WakaTime
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <Skeleton className="h-10 w-48" />
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                type="date"
                value={date}
                max={todayStr()}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 rounded-sm border-2 border-line-input bg-white px-3 text-sm text-ink-800"
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={refreshing}
                onClick={async () => {
                  setRefreshing(true);
                  await load(true);
                  setRefreshing(false);
                }}
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? "animate-spin" : ""}
                />
                Sync
              </Button>
            </div>
          </div>
          {oauthOk && (
            <div className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-sm px-3 py-2">
              Uỷ quyền WakaTime thành công.
            </div>
          )}
          {oauthErr && (
            <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
              Lỗi OAuth: {oauthErr}
            </div>
          )}
        </CardBody>
      </Card>

      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardBody>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <div className="flex items-start gap-3 text-red-700">
                <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold">
                    Không lấy được dữ liệu từ WakaTime
                  </div>
                  <div className="text-sm mt-1">{error}</div>
                </div>
              </div>
              {emp?.authType === "api_key" && (
                <UpdateApiKeyDialog
                  employeeId={emp._id}
                  onUpdated={async () => {
                    await reloadEmp();
                    await load(true);
                  }}
                />
              )}
              {emp?.authType === "oauth" && (
                <a
                  href={`/api/oauth/wakatime/authorize?employeeId=${emp._id}`}
                  className="inline-flex items-center px-3 h-9 text-sm font-semibold rounded-pill bg-accent text-white hover:bg-accent-hover whitespace-nowrap"
                >
                  Authorize lại
                </a>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="text-sm text-ink-500 uppercase tracking-wide">
              Tổng giờ trong ngày
            </div>
            {loading ? (
              <Skeleton className="h-9 w-24 mt-1" />
            ) : (
              <div className="text-3xl font-semibold text-primary-dark">
                {formatHours(summary?.totalSeconds ?? 0)}
              </div>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-sm text-ink-500 uppercase tracking-wide">
              Số project
            </div>
            {loading ? (
              <Skeleton className="h-9 w-12 mt-1" />
            ) : (
              <div className="text-3xl font-semibold text-primary-dark">
                {summary?.projects.length ?? 0}
              </div>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-sm text-ink-500 uppercase tracking-wide">
              Ngày
            </div>
            <div className="text-3xl font-semibold text-primary-dark">
              {date}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project (giờ)</CardTitle>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <HoursBarChart
              data={(summary?.projects ?? []).map((p) => ({
                name: p.name,
                totalSeconds: p.totalSeconds,
              }))}
            />
          )}
        </CardBody>
      </Card>

      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-primary-dark">
          Chi tiết branch theo project
        </h2>
        {!loading && summary?.projects.length === 0 && (
          <Card>
            <CardBody>
              <div className="text-center text-ink-400 py-8">
                Không có hoạt động trong ngày này.
              </div>
            </CardBody>
          </Card>
        )}
        {summary?.projects.map((p) => {
          const open = expanded[p.name] ?? false;
          return (
            <Card key={p.name}>
              <button
                onClick={() => setExpanded((s) => ({ ...s, [p.name]: !open }))}
                className="w-full text-left p-5 flex items-center justify-between hover:bg-surface-cyan/30 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <span className="font-semibold text-primary-dark">
                    {p.name}
                  </span>
                  <Badge>{p.branches.length} branch</Badge>
                </div>
                <span className="font-bold text-primary">
                  {formatHours(p.totalSeconds)}
                </span>
              </button>
              {open && (
                <div className="px-5 pb-5">
                  <HoursBarChart
                    data={p.branches}
                    color="#FF6A14"
                    height={Math.max(120, p.branches.length * 28 + 60)}
                  />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
