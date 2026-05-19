"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkItemCard } from "@/components/WorkItemCard";
import { AdoConfigDialog, AdoDisableButton } from "@/components/AdoConfigDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, RefreshCw, Settings, Loader2, Pause, Upload } from "lucide-react";

interface WakaTimeByWorkItem {
  workItemId: number;
  totalSeconds: number;
}

interface WorkItem {
  id: number;
  url: string;
  htmlUrl: string;
  title: string;
  state: string;
  type: string;
  remainingWork: number | null;
  completedWork: number | null;
}

interface ActiveSession {
  id: string;
  workItemId: number;
  startedAt: string;
}

interface AdoConfig {
  organization: string | null;
  project: string | null;
  email: string | null;
  enabled: boolean;
  workItemTypes?: string[];
}

export default function AdoWorkItemsPage({
  params,
}: {
  params: { id: string };
}) {
  const [config, setConfig] = useState<AdoConfig | null>(null);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [wakaTimeMap, setWakaTimeMap] = useState<Map<number, number>>(new Map());
  const [loggingWorkIds, setLoggingWorkIds] = useState<Set<number>>(new Set());
  const [bulkLogging, setBulkLogging] = useState(false);

  // Fetch config
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`/api/employees/${params.id}/ado`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch {
      setConfig(null);
    }
  }, [params.id]);

  // Fetch work items
  const fetchWorkItems = useCallback(
    async (forceRefresh = false) => {
      if (!config?.enabled) {
        setWorkItems([]);
        setLoading(false);
        return;
      }

      try {
        const params2 = new URLSearchParams();
        if (forceRefresh) params2.set("refresh", "1");
        if (stateFilter !== "all") params2.set("state", stateFilter);
        if (typeFilter !== "all") params2.set("type", typeFilter);

        const res = await fetch(
          `/api/employees/${params.id}/ado/workitems?${params2}`,
        );
        if (!res.ok) throw new Error("Lỗi tải work items");

        const data = await res.json();
        setWorkItems(data.workItems || []);
        setError(null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Lỗi không xác định");
        setWorkItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [config?.enabled, params.id, stateFilter, typeFilter],
  );

  // Fetch active session
  const fetchActiveSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/employees/${params.id}/ado/sessions`);
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data.session);
      }
    } catch {
      setActiveSession(null);
    }
  }, [params.id]);

  const fetchWakaTime = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/dashboard/ado?employeeId=${params.id}&preset=month`,
      );
      if (!res.ok) return;
      const data = await res.json();
      const m = new Map<number, number>();
      for (const wi of data.workItems ?? []) {
        m.set(wi.workItemId, wi.totalSeconds);
      }
      setWakaTimeMap(m);
    } catch {
      // non-critical
    }
  }, [params.id]);

  // Initial load
  useEffect(() => {
    fetchConfig();
    fetchActiveSession();
    fetchWakaTime();
  }, [fetchConfig, fetchActiveSession, fetchWakaTime]);

  // Fetch work items when config or filters change
  useEffect(() => {
    if (config) {
      setLoading(true);
      fetchWorkItems();
    }
  }, [config, fetchWorkItems]);

  // Refresh work items
  const handleRefresh = () => {
    setRefreshing(true);
    fetchWorkItems(true);
  };

  // Start tracking
  const handleStart = async (workItemId: number) => {
    try {
      const res = await fetch(`/api/employees/${params.id}/ado/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workItemId }),
      });

      if (!res.ok) throw new Error("Lỗi bắt đầu tracking");

      const data = await res.json();
      setActiveSession(data.session);

      // Refresh work items to show updated data
      fetchWorkItems(true);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi không xác định");
    }
  };

  // Stop tracking
  const handleStop = async () => {
    try {
      const res = await fetch(`/api/employees/${params.id}/ado/sessions`, {
        method: "PATCH",
      });

      if (!res.ok) throw new Error("Lỗi dừng tracking");

      setActiveSession(null);
      fetchWorkItems(true);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi không xác định");
    }
  };

  // Log WakaTime hours to ADO (single)
  const handleLogWork = async (workItemId: number, hours: number) => {
    setLoggingWorkIds((s) => new Set(s).add(workItemId));
    try {
      const res = await fetch(`/api/employees/${params.id}/ado/logwork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workItemId, hours }),
      });
      if (!res.ok) throw new Error("Lỗi log work");
      fetchWorkItems(true);
      fetchWakaTime();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setLoggingWorkIds((s) => {
        const next = new Set(s);
        next.delete(workItemId);
        return next;
      });
    }
  };

  // Bulk log all WakaTime hours to ADO
  const handleBulkLog = async () => {
    const items: { workItemId: number; hours: number }[] = [];
    for (const [wiId, seconds] of wakaTimeMap) {
      if (seconds > 0) items.push({ workItemId: wiId, hours: seconds / 3600 });
    }
    if (!items.length) return;

    setBulkLogging(true);
    try {
      const res = await fetch(`/api/employees/${params.id}/ado/logwork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error("Lỗi bulk log work");
      const data = await res.json();
      const failed = data.results?.filter((r: { success: boolean }) => !r.success) ?? [];
      if (failed.length) {
        alert(`${failed.length} work items lỗi khi log`);
      }
      fetchWorkItems(true);
      fetchWakaTime();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setBulkLogging(false);
    }
  };

  // Get unique states and types for filters
  const states = Array.from(new Set(workItems.map((wi) => wi.state))).sort();
  const types = Array.from(new Set(workItems.map((wi) => wi.type))).sort();

  if (loading && !config) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (!config?.enabled) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/employees/${params.id}`}
            className="text-gray-600 hover:text-gray-900"
          >
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} /> Quay lại
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Azure DevOps Tickets
          </h1>
        </div>

        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">🔧</div>
            <h2 className="text-xl font-semibold mb-2">
              Chưa kết nối Azure DevOps
            </h2>
            <p className="text-gray-600 mb-6">
              Cấu hình Azure DevOps để theo dõi và quản lý work items
            </p>
            <AdoConfigDialog
              employeeId={params.id}
              currentConfig={config || undefined}
              onConfigured={() => {
                fetchConfig();
                fetchWorkItems();
              }}
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link
            href={`/employees/${params.id}`}
            className="text-gray-600 hover:text-gray-900 shrink-0"
          >
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Quay lại</span>
            </Button>
          </Link>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 truncate">
            <span className="sm:hidden">ADO Tickets</span>
            <span className="hidden sm:inline">Azure DevOps Tickets</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className="text-sm border border-line-soft truncate max-w-[60vw]">
            <span className="sm:hidden">
              {config.project || config.organization}
            </span>
            <span className="hidden sm:inline">
              {config.organization}
              {config.project && ` / ${config.project}`}
            </span>
          </Badge>
          {config.email && (
            <Badge className="hidden sm:inline-flex text-sm border border-line-soft bg-blue-50">
              {config.email}
            </Badge>
          )}

          {config.enabled && (
            <>
              <AdoConfigDialog
                employeeId={params.id}
                currentConfig={config}
                onConfigured={fetchConfig}
              />
              <AdoDisableButton
                employeeId={params.id}
                onDisabled={() => {
                  fetchConfig();
                  setWorkItems([]);
                  setActiveSession(null);
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="h-8 w-auto min-w-[120px] sm:min-w-[140px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {states.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-auto min-w-[120px] sm:min-w-[140px]">
            <SelectValue placeholder="Loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="secondary"
          size="sm"
          className="h-8"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            size={14}
            className={refreshing ? "animate-spin" : ""}
          />
          <span className="hidden sm:inline">Làm mới</span>
        </Button>

        {wakaTimeMap.size > 0 && (
          <Button
            variant="primary"
            size="sm"
            className="h-8"
            onClick={handleBulkLog}
            disabled={bulkLogging}
          >
            {bulkLogging ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            <span className="hidden sm:inline">Log tất cả → ADO</span>
            <span className="sm:hidden">Log ADO</span>
          </Button>
        )}
      </div>

      {/* Active session banner */}
      {activeSession && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
            <span className="font-medium text-orange-900">
              Đang tracking ticket #{activeSession.workItemId}
            </span>
          </div>
          <Button variant="danger" size="sm" onClick={handleStop}>
            <Pause size={14} /> Dừng
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="p-4 mb-6 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {/* Work items grid */}
      {refreshing && workItems.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      ) : workItems.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-semibold mb-2">Không có ticket nào</h3>
          <p className="text-gray-600">
            Không tìm thấy work item được assign cho người này
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {workItems.map((workItem) => (
            <WorkItemCard
              key={workItem.id}
              workItem={workItem}
              isActive={activeSession?.workItemId === workItem.id}
              activeSessionStartedAt={
                activeSession?.workItemId === workItem.id
                  ? new Date(activeSession.startedAt)
                  : null
              }
              wakaTimeSeconds={wakaTimeMap.get(workItem.id)}
              loggingWork={loggingWorkIds.has(workItem.id)}
              onLogWork={handleLogWork}
              onStart={() => handleStart(workItem.id)}
              onStop={handleStop}
            />
          ))}
        </div>
      )}
    </div>
  );
}
