export function secondsToHours(s: number): number {
  return Math.round((s / 3600) * 100) / 100;
}

export function formatHours(s: number): string {
  if (!s || s <= 0) return "0h";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
