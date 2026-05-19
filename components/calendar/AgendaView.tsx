"use client";

import { format, isSameDay } from "date-fns";
import type { CalEvent } from "./types";
import { colorForId } from "@/lib/color";

interface Props {
  events: CalEvent[];
  onEventClick: (ev: CalEvent) => void;
}

export function AgendaView({ events, onEventClick }: Props) {
  const sorted = [...events].sort(
    (a, b) => +new Date(a.start) - +new Date(b.start),
  );
  // group by date
  const groups: { day: Date; items: CalEvent[] }[] = [];
  for (const ev of sorted) {
    const d = new Date(ev.start);
    const last = groups[groups.length - 1];
    if (last && isSameDay(last.day, d)) last.items.push(ev);
    else groups.push({ day: d, items: [ev] });
  }
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-surface-tint bg-white p-8 text-center text-ink-400">
        Không có sự kiện trong khoảng thời gian này.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-surface-tint bg-white divide-y divide-surface-tint">
      {groups.map((g) => (
        <div key={g.day.toISOString()} className="p-4">
          <div className="text-sm uppercase tracking-wide text-ink-500 mb-2">
            {format(g.day, "EEEE, d MMMM yyyy")}
          </div>
          <ul className="space-y-2">
            {g.items.map((ev) => {
              const color = colorForId(ev.employeeId);
              const s = new Date(ev.start);
              const e = new Date(ev.end);
              return (
                <li key={ev._id}>
                  <button
                    type="button"
                    onClick={() => onEventClick(ev)}
                    className="w-full text-left flex items-start gap-3 rounded-sm border border-surface-tint p-3 hover:bg-surface-cyan/30"
                  >
                    <span
                      className="mt-1 inline-block h-2.5 w-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: color.border,
                      }}
                    />
                    <div className="min-w-[120px] text-xs text-ink-500">
                      {ev.isAllDay
                        ? "All-day"
                        : `${format(s, "HH:mm")} – ${format(e, "HH:mm")}`}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-ink-800">
                        {ev.subject || "(Untitled)"}
                      </div>
                      <div className="text-xs text-ink-500">
                        {ev.employeeName}
                        {ev.location ? ` · ${ev.location}` : ""}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
