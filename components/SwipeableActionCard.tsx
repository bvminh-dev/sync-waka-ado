"use client";

import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { cn } from "@/lib/utils";

interface SwipeableActionCardProps {
  children: React.ReactNode;
  actionContent: React.ReactNode;
  onSwipeActivate?: () => void;
  actionPosition?: "left" | "right";
  className?: string;
}

export function SwipeableActionCard({
  children,
  actionContent,
  onSwipeActivate,
  actionPosition = "left",
  className,
}: SwipeableActionCardProps) {
  const [offset, setOffset] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (actionPosition === "left" && e.deltaX < 0) {
        // Swipe left
        setOffset(Math.max(-120, Math.min(0, e.deltaX)));
      } else if (actionPosition === "right" && e.deltaX > 0) {
        // Swipe right
        setOffset(Math.min(120, Math.max(0, e.deltaX)));
      }
    },
    onSwiped: (e) => {
      if (actionPosition === "left" && e.deltaX < -60) {
        setIsRevealed(true);
        setOffset(-120);
        onSwipeActivate?.();
      } else if (actionPosition === "right" && e.deltaX > 60) {
        setIsRevealed(true);
        setOffset(120);
        onSwipeActivate?.();
      } else {
        setIsRevealed(false);
        setOffset(0);
      }
    },
    onSwipedLeft: () => {
      if (actionPosition === "left" && Math.abs(offset) > 60) {
        setIsRevealed(true);
        setOffset(-120);
      } else if (actionPosition === "left") {
        setIsRevealed(false);
        setOffset(0);
      }
    },
    onSwipedRight: () => {
      if (actionPosition === "right" && offset > 60) {
        setIsRevealed(true);
        setOffset(120);
      } else if (actionPosition === "right") {
        setIsRevealed(false);
        setOffset(0);
      }
    },
    trackMouse: true,
    trackTouch: true,
  });

  const reset = () => {
    setIsRevealed(false);
    setOffset(0);
  };

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      {/* Action layer (behind) */}
      <div
        className={cn(
          "absolute inset-0 flex items-center p-4 bg-orange-50 dark:bg-orange-950",
          actionPosition === "left"
            ? "justify-start origin-left"
            : "justify-end origin-right",
        )}
      >
        {actionContent}
      </div>

      {/* Content layer (swipeable) */}
      <div
        {...handlers}
        className="relative bg-white transition-transform duration-200 ease-out"
        style={{
          transform: `translateX(${offset}px)`,
          cursor: "grab",
        }}
        onMouseLeave={reset}
      >
        {children}
      </div>
    </div>
  );
}
