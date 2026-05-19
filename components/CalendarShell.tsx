"use client";

import { useEffect, useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  addMonths,
  addWeeks,
  addDays,
  format,
} from "date-fns";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { colorForId } from "@/lib/color";
import type { CalEvent, CalEmployee, CalendarView } from "./calendar/types";
import { MonthView } from "./calendar/MonthView";
import { WeekView } from "./calendar/WeekView";
import { DayView } from "./calendar/DayView";
import { AgendaView } from "./calendar/AgendaView";
import { EventDetailDialog } from "./calendar/EventDetailDialog";

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: "month", label: "Tháng" },
  { id: "week", label: "Tuần" },
  { id: "day", label: "Ngày" },
  { id: "agenda", label: "Danh sách" },
];

function rangeForView(view: CalendarView, ref: Date): { start: Date; end: Date } {
  switch (view) {
    case "month":
      return {
        start: startOfWeek(startOfMonth(ref), { weekStartsOn: 1 }),
        end: addDays(endOfWeek(endOfMonth(ref), { weekStartsOn: 1 }), 1),
      };
    case "week":
      return {
        start: startOfWeek(ref, { weekStartsOn: 1 }),
        end: addDays(endOfWeek(ref, { weekStartsOn: 1 }), 1),
      };
    case "day":
      return { start: startOfDay(ref), end: addDays(startOfDay(ref), 1) };
    case "agenda":
      return {
        start: startOfDay(ref),
        end: addDays(startOfDay(ref), 30),
      };
  }
}

function rangeLabel(view: CalendarView, ref: Date): string {
  if (view === "month") return format(ref, "MMMM yyyy");
  if (view === "week") {
    const s = startOfWeek(ref, { weekStartsOn: 1 });
    const e = endOfWeek(ref, { weekStartsOn: 1 });
    return `${format(s, "d MMM")} – ${format(e, "d MMM yyyy")}`;
  }
  if (view === "day") return format(ref, "EEEE, d MMM yyyy");
  return `${format(ref, "d MMM")} → ${format(addDays(ref, 30), "d MMM yyyy")}`;
}

export function CalendarShell() {
  const [view, setView] = useState<CalendarView>("month");
  const [refDate, setRefDate] = useState(new Date());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [employees, setEmployees] = useState<CalEmployee[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [openEvent, setOpenEvent] = useState<CalEvent | null>(null);

  const range = useMemo(() => rangeForView(view, refDate), [view, refDate]);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      });
      if (selectedEmpIds.length > 0)
        params.set("employeeIds", selectedEmpIds.join(","));
      const res = await fetch(`/api/calendar/events?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lỗi tải dữ liệu");
      setEvents(json.events ?? []);
      setEmployees(json.employees ?? []);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, refDate.getTime(), selectedEmpIds.join(",")]);

  async function syncAll() {
    setSyncing(true);
    setMsg(null);
    try {
      const params = new URLSearchParams({
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      });
      const res = await fetch(`/api/calendar/sync?${params.toString()}`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sync lỗi");
      const ok = (json.results ?? []).filter(
        (r: { count?: number }) => typeof r.count === "number",
      ).length;
      const total = (json.results ?? []).reduce(
        (sum: number, r: { count?: number }) => sum + (r.count ?? 0),
        0,
      );
      setMsg(`Đã sync ${ok} nhân sự, tổng ${total} sự kiện.`);
      await load();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Sync lỗi");
    } finally {
      setSyncing(false);
    }
  }

  function navigate(dir: -1 | 0 | 1) {
    if (dir === 0) {
      setRefDate(new Date());
      return;
    }
    if (view === "month") setRefDate((d) => addMonths(d, dir));
    else if (view === "week") setRefDate((d) => addWeeks(d, dir));
    else if (view === "day") setRefDate((d) => addDays(d, dir));
    else setRefDate((d) => addDays(d, dir * 30));
  }

  function toggleEmp(id: string) {
    setSelectedEmpIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardBody>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate(0)}>
                  Hôm nay
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate(1)}>
                  <ChevronRight size={16} />
                </Button>
                <div className="text-lg font-semibold text-primary-dark px-2">
                  {rangeLabel(view, refDate)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-md border border-line-soft overflow-hidden">
                  {VIEWS.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setView(v.id)}
                      className={`px-3 h-9 text-sm font-bold transition ${
                        view === v.id
                          ? "bg-accent text-white"
                          : "bg-white text-ink-700 hover:bg-surface-cyan/40"
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={syncing}
                  onClick={syncAll}
                >
                  <RefreshCw
                    size={14}
                    className={syncing ? "animate-spin" : ""}
                  />
                  Sync All
                </Button>
              </div>
            </div>

            {employees.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-ink-500">
                  Nhân sự:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedEmpIds([])}
                  className={`px-2.5 py-1 rounded-full text-xs border transition ${
                    selectedEmpIds.length === 0
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-ink-700 border-line-soft hover:bg-surface-cyan/40"
                  }`}
                >
                  Tất cả
                </button>
                {employees.map((e) => {
                  const c = colorForId(e._id);
                  const active = selectedEmpIds.includes(e._id);
                  return (
                    <button
                      key={e._id}
                      type="button"
                      onClick={() => toggleEmp(e._id)}
                      className="px-2.5 py-1 rounded-full text-xs border transition flex items-center gap-1.5"
                      style={{
                        backgroundColor: active ? c.bg : "white",
                        color: active ? c.fg : "#475569",
                        borderColor: active ? c.border : "#E2E8F0",
                      }}
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: c.border }}
                      />
                      {e.name}
                    </button>
                  );
                })}
              </div>
            )}

            {msg && <div className="text-sm text-ink-700">{msg}</div>}
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <div className="rounded-xl border border-surface-tint bg-white p-8 text-center text-ink-400">
          Đang tải...
        </div>
      ) : view === "month" ? (
        <MonthView
          refDate={refDate}
          events={events}
          onEventClick={setOpenEvent}
          onDayClick={(d) => {
            setRefDate(d);
            setView("day");
          }}
        />
      ) : view === "week" ? (
        <WeekView
          refDate={refDate}
          events={events}
          onEventClick={setOpenEvent}
        />
      ) : view === "day" ? (
        <DayView
          refDate={refDate}
          events={events}
          onEventClick={setOpenEvent}
        />
      ) : (
        <AgendaView events={events} onEventClick={setOpenEvent} />
      )}

      <EventDetailDialog
        event={openEvent}
        onClose={() => setOpenEvent(null)}
      />
    </div>
  );
}
