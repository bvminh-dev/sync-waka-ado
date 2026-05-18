"use client";
import * as React from "react";
import { cn } from "@/lib/format";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...rest }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-sm border-2 border-line-input bg-white px-3 text-sm text-ink-800 placeholder:text-ink-400 shadow-inset",
      "focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20",
      "disabled:bg-[#F5F5F5] disabled:opacity-60",
      className,
    )}
    {...rest}
  />
));
Input.displayName = "Input";

export function Label({
  className,
  ...rest
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block text-sm font-semibold text-ink-800 mb-2",
        className,
      )}
      {...rest}
    />
  );
}
