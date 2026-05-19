"use client";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from "date-fns";
import type { CalEvent } from "./types";
import { EventChip } from "./EventChip";

interface Props {
  refDate: Date;
  events: CalEvent[];
  onEventClick: (ev: CalEvent) => void;
  onDayClick?: (d: Date) => void;
}

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function MonthView({ refDate, events, onEventClick, onDayClick }: Props) {
  const gridStart = startOfWeek(startOfMonth(refDate), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(refDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const today = new Date();

  return (
    <div className="rounded-xl border border-surface-tint bg-white overflow-hidden">
      <div className="grid grid-cols-7 bg-surface-cyan/40 text-xs uppercase tracking-wide font-semibold text-ink-500">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-2 border-r border-surface-tint last:border-r-0">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map((d) => {
          const inMonth = isSameMonth(d, refDate);
          const isToday = isSameDay(d, today);
          const dayEvents = events
            .filter((e) => isSameDay(new Date(e.start), d))
            .sort((a, b) => +new Date(a.start) - +new Date(b.start));
          const max = 3;
          const visible = dayEvents.slice(0, max);
          const more = dayEvents.length - visible.length;
          return (
            <div
              key={d.toISOString()}
              className={`min-h-[110px] border-r border-b border-surface-tint last:border-r-0 p-1.5 ${inMonth ? "bg-white" : "bg-[#FAFAFA]"}`}
              onClick={() => onDayClick?.(d)}
              role={onDayClick ? "button" : undefined}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`inline-flex items-center justify-center h-6 min-w-[24px] px-1 text-xs font-semibold rounded-full ${
                    isToday
                      ? "bg-accent text-white"
                      : inMonth
                        ? "text-ink-800"
                        : "text-ink-400"
                  }`}
                >
                  {format(d, "d")}
                </span>
              </div>
              <div className="space-y-1">
                {visible.map((ev) => (
                  <EventChip
                    key={ev._id}
                    event={ev}
                    compact
                    onClick={() => onEventClick(ev)}
                  />
                ))}
                {more > 0 && (
                  <div className="text-[11px] text-ink-500 pl-1">
                    +{more} sự kiện khác
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
