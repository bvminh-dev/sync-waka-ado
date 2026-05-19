"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, ExternalLink } from "lucide-react";

interface WorkItemCardProps {
  workItem: {
    id: number;
    url: string;
    htmlUrl: string;
    title: string;
    state: string;
    type: string;
    remainingWork: number | null;
    completedWork: number | null;
  };
  isActive: boolean;
  activeSessionStartedAt?: Date | null;
  onStart: () => void;
  onStop: () => void;
}

const stateColors: Record<string, string> = {
  New: "bg-gray-100 text-gray-700",
  Active: "bg-blue-100 text-blue-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Resolved: "bg-green-100 text-green-700",
  Closed: "bg-gray-100 text-gray-500",
  Done: "bg-green-100 text-green-700",
  Removed: "bg-red-100 text-red-700",
};

const typeColors: Record<string, string> = {
  Bug: "bg-red-50 text-red-600 border-red-200",
  Task: "bg-blue-50 text-blue-600 border-blue-200",
  "User Story": "bg-purple-50 text-purple-600 border-purple-200",
  Feature: "bg-green-50 text-green-600 border-green-200",
  Epic: "bg-orange-50 text-orange-600 border-orange-200",
};

function formatElapsedTime(startDate: Date): string {
  const now = new Date();
  const diff = now.getTime() - startDate.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function WorkItemCard({
  workItem,
  isActive,
  activeSessionStartedAt,
  onStart,
  onStop,
}: WorkItemCardProps) {
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");

  useEffect(() => {
    if (isActive && activeSessionStartedAt) {
      setElapsedTime(formatElapsedTime(activeSessionStartedAt));
      const interval = setInterval(() => {
        setElapsedTime(formatElapsedTime(activeSessionStartedAt));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime("00:00:00");
    }
  }, [isActive, activeSessionStartedAt]);

  const stateColor = useMemo(
    () => stateColors[workItem.state] || "bg-gray-100 text-gray-700",
    [workItem.state],
  );
  const typeColor = useMemo(
    () => typeColors[workItem.type] || "bg-gray-50 text-gray-600 border-gray-200",
    [workItem.type],
  );

  return (
    <Card
      className={`p-5 hover:shadow-lg transition-shadow flex flex-col h-full ${isActive ? "ring-2 ring-orange-400" : ""}`}
    >
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-sm font-mono text-gray-500">
          #{workItem.id}
        </span>
        <Badge className={typeColor}>{workItem.type}</Badge>
        <Badge className={stateColor}>{workItem.state}</Badge>
      </div>

      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
        {workItem.title}
      </h3>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3 mt-auto">
        {workItem.remainingWork !== null && (
          <span>
            Còn lại: <strong>{workItem?.remainingWork?.toFixed(1) || 0}h</strong>
          </span>
        )}
        {workItem.completedWork !== null && (
          <span>
            Đã làm: <strong>{workItem?.completedWork?.toFixed(1) || 0}h</strong>
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
        {isActive ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
            <span className="text-base font-mono font-semibold text-orange-600 truncate">
              {elapsedTime}
            </span>
          </div>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={workItem.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="sm">
              <ExternalLink size={14} />
            </Button>
          </Link>
          <Button
            variant={isActive ? "danger" : "primary"}
            size="sm"
            onClick={isActive ? onStop : onStart}
          >
            {isActive ? (
              <>
                <Pause size={14} /> Stop
              </>
            ) : (
              <>
                <Play size={14} /> Start
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
