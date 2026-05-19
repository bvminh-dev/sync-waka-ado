"use client";
import { colorForId } from "@/lib/color";
import type { CalEvent } from "./types";

interface Props {
  event: CalEvent;
  compact?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

export function EventChip({ event, compact, onClick, style, className }: Props) {
  const color = colorForId(event.employeeId);
  const start = new Date(event.start);
  const timeLabel = event.isAllDay
    ? "All-day"
    : start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${event.subject} · ${event.employeeName}`}
      className={`text-left w-full truncate rounded-sm border px-1.5 py-0.5 text-xs hover:brightness-95 transition ${className ?? ""}`}
      style={{
        backgroundColor: color.bg,
        color: color.fg,
        borderColor: color.border,
        ...style,
      }}
    >
      {compact ? (
        <span className="truncate block">
          <span className="font-semibold mr-1">{timeLabel}</span>
          {event.subject || "(Untitled)"}
        </span>
      ) : (
        <div className="space-y-0.5">
          <div className="text-[10px] uppercase tracking-wide opacity-80">
            {event.employeeName} · {timeLabel}
          </div>
          <div className="truncate font-semibold">
            {event.subject || "(Untitled)"}
          </div>
        </div>
      )}
    </button>
  );
}
