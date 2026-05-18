import * as React from "react";
import { cn } from "@/lib/format";

export function Badge({
  className,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill bg-surface-cyan px-3 py-1 text-xs font-semibold text-primary",
        className,
      )}
      {...rest}
    />
  );
}
