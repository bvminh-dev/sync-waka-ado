import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  eachDayOfInterval,
  parseISO,
} from "date-fns";

export type RangePreset =
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "year"
  | "custom";

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;
}

export function resolveRange(preset: RangePreset, ref = new Date()): DateRange {
  switch (preset) {
    case "day":
      return { start: fmt(startOfDay(ref)), end: fmt(endOfDay(ref)) };
    case "week":
      return {
        start: fmt(startOfWeek(ref, { weekStartsOn: 1 })),
        end: fmt(endOfWeek(ref, { weekStartsOn: 1 })),
      };
    case "month":
      return { start: fmt(startOfMonth(ref)), end: fmt(endOfMonth(ref)) };
    case "quarter":
      return { start: fmt(startOfQuarter(ref)), end: fmt(endOfQuarter(ref)) };
    case "year":
      return { start: fmt(startOfYear(ref)), end: fmt(endOfYear(ref)) };
    default:
      return { start: fmt(ref), end: fmt(ref) };
  }
}

export function fmt(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function daysInRange(range: DateRange): string[] {
  const start = parseISO(range.start);
  const end = parseISO(range.end);
  return eachDayOfInterval({ start, end }).map(fmt);
}

export function todayStr(): string {
  return fmt(new Date());
}
