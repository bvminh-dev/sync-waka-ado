"use client";

import { isSameDay, format } from "date-fns";
import type { CalEvent } from "./types";
import { colorForId } from "@/lib/color";

interface Props {
  refDate: Date;
  events: CalEvent[];
  onEventClick: (ev: CalEvent) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_PX = 56;

export function DayView({ refDate, events, onEventClick }: Props) {
  const dayEvents = events.filter((e) => isSameDay(new Date(e.start), refDate));
  return (
    <div className="rounded-xl border border-surface-tint bg-white overflow-hidden">
      <div className="px-4 py-3 bg-surface-cyan/40 border-b border-surface-tint">
        <div className="text-sm text-ink-500 uppercase">
          {format(refDate, "EEEE")}
        </div>
        <div className="text-2xl font-semibold text-primary-dark">
          {format(refDate, "d MMMM yyyy")}
        </div>
      </div>
      <div className="grid grid-cols-[60px_1fr] relative">
        <div>
          {HOURS.map((h) => (
            <div
              key={h}
              style={{ height: HOUR_PX }}
              className="text-[11px] text-ink-400 px-2 border-b border-surface-tint"
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        <div
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
              22,
              ((endMin - startMin) / 60) * HOUR_PX - 2,
            );
            const color = colorForId(ev.employeeId);
            return (
              <button
                key={ev._id}
                type="button"
                onClick={() => onEventClick(ev)}
                className="absolute left-2 right-2 text-left rounded-sm border px-2 py-1 text-xs hover:brightness-95"
                style={{
                  top,
                  height,
                  backgroundColor: color.bg,
                  color: color.fg,
                  borderColor: color.border,
                }}
              >
                <div className="font-semibold truncate">
                  {ev.subject || "(Untitled)"}
                </div>
                <div className="opacity-80 truncate">
                  {ev.employeeName}
                  {ev.location ? ` · ${ev.location}` : ""}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
