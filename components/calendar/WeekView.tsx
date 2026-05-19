"use client";

import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  format,
} from "date-fns";
import type { CalEvent } from "./types";
import { colorForId } from "@/lib/color";

interface Props {
  refDate: Date;
  events: CalEvent[];
  onEventClick: (ev: CalEvent) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_PX = 48;

export function WeekView({ refDate, events, onEventClick }: Props) {
  const start = startOfWeek(refDate, { weekStartsOn: 1 });
  const end = endOfWeek(refDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });
  const today = new Date();

  return (
    <div className="rounded-xl border border-surface-tint bg-white overflow-hidden">
      <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-surface-cyan/40 border-b border-surface-tint">
        <div />
        {days.map((d) => {
          const isToday = isSameDay(d, today);
          return (
            <div
              key={d.toISOString()}
              className="px-2 py-2 text-xs font-semibold text-ink-700 border-l border-surface-tint"
            >
              <div className="uppercase text-ink-500">{format(d, "EEE")}</div>
              <div
                className={`inline-flex items-center justify-center h-6 min-w-[24px] mt-0.5 rounded-full ${isToday ? "bg-accent text-white" : ""}`}
              >
                {format(d, "d")}
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
        <div>
          {HOURS.map((h) => (
            <div
              key={h}
              style={{ height: HOUR_PX }}
              className="text-[10px] text-ink-400 px-2 border-b border-surface-tint"
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        {days.map((d) => {
          const dayEvents = events.filter((e) =>
            isSameDay(new Date(e.start), d),
          );
          return (
            <div
              key={d.toISOString()}
              className="relative border-l border-surface-tint"
              style={{ height: HOUR_PX * 24 }}
            >
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{ height: HOUR_PX }}
                  className="border-b border-surface-tint/70"
                />
              ))}
              {dayEvents.map((ev) => {
                const s = new Date(ev.start);
                const e = new Date(ev.end);
                const startMin = s.getHours() * 60 + s.getMinutes();
                const endMin = e.getHours() * 60 + e.getMinutes();
                const top = (startMin / 60) * HOUR_PX;
                const height = Math.max(
                  18,
                  ((endMin - startMin) / 60) * HOUR_PX - 2,
                );
                const color = colorForId(ev.employeeId);
                return (
                  <button
                    key={ev._id}
                    type="button"
                    onClick={() => onEventClick(ev)}
                    className="absolute left-1 right-1 text-left rounded-sm border px-1.5 py-1 text-[11px] overflow-hidden hover:brightness-95"
                    style={{
                      top,
                      height,
                      backgroundColor: color.bg,
                      color: color.fg,
                      borderColor: color.border,
                    }}
                    title={`${ev.subject} · ${ev.employeeName}`}
                  >
                    <div className="font-semibold truncate">
                      {ev.subject || "(Untitled)"}
                    </div>
                    <div className="opacity-80 truncate">{ev.employeeName}</div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
