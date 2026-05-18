"use client";
import { cn } from "@/lib/format";
import type { RangePreset } from "@/lib/ranges";

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "day", label: "Hôm nay" },
  { value: "week", label: "Tuần này" },
  { value: "month", label: "Tháng này" },
  { value: "quarter", label: "Quý này" },
  { value: "year", label: "Năm nay" },
];

export function RangePicker({
  value,
  onChange,
}: {
  value: RangePreset;
  onChange: (v: RangePreset) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={cn(
            "px-3 sm:px-4 h-9 rounded-pill text-sm font-medium border transition",
            value === p.value
              ? "bg-primary text-white border-primary"
              : "bg-white text-ink-800 border-line-soft hover:bg-surface-cyan",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
