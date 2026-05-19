"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { colorForId } from "@/lib/color";
import type { CalEvent } from "./types";
import { Clock, MapPin, User, ExternalLink } from "lucide-react";

interface Props {
  event: CalEvent | null;
  onClose: () => void;
}

export function EventDetailDialog({ event, onClose }: Props) {
  if (!event) return null;
  const color = colorForId(event.employeeId);
  const start = new Date(event.start);
  const end = new Date(event.end);
  const sameDay = start.toDateString() === end.toDateString();
  const timeLabel = event.isAllDay
    ? `${start.toLocaleDateString()} (cả ngày)`
    : sameDay
      ? `${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : `${start.toLocaleString()} → ${end.toLocaleString()}`;

  return (
    <Dialog open={!!event} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event.subject || "(Untitled)"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full border"
              style={{ backgroundColor: color.bg, borderColor: color.border }}
            />
            <span className="font-semibold">{event.employeeName}</span>
          </div>
          <div className="flex items-start gap-2 text-ink-700">
            <Clock size={16} className="mt-0.5 shrink-0" />
            <span>{timeLabel}</span>
          </div>
          {event.location && (
            <div className="flex items-start gap-2 text-ink-700">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
          {event.organizer && (
            <div className="flex items-start gap-2 text-ink-700">
              <User size={16} className="mt-0.5 shrink-0" />
              <span>{event.organizer}</span>
            </div>
          )}
          {event.bodyPreview && (
            <div className="rounded-sm bg-surface-cyan/40 p-3 text-ink-700 whitespace-pre-wrap">
              {event.bodyPreview}
            </div>
          )}
          {event.webLink && (
            <a
              href={event.webLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink size={14} />
              Mở trong Outlook
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
