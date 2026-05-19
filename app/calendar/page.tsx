"use client";

import { CalendarShell } from "@/components/CalendarShell";

export default function CalendarPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-primary-dark">
          Calendar
        </h1>
        <p className="text-ink-500 mt-1">
          Lịch Outlook tổng hợp của cả team. Bấm Sync All để kéo dữ liệu mới nhất.
        </p>
      </div>
      <CalendarShell />
    </div>
  );
}
