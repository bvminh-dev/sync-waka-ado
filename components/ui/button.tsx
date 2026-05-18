"use client";
import * as React from "react";
import { cn } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white border border-accent shadow-btn hover:bg-accent-hover active:scale-[.98]",
  secondary:
    "bg-brand-blue text-white border border-brand-border shadow-btn hover:bg-brand-border active:scale-[.98]",
  ghost:
    "bg-transparent text-ink-800 border border-line-soft hover:bg-[#F5F5F5]",
  outline:
    "bg-transparent text-primary border border-primary hover:bg-surface-cyan",
  danger:
    "bg-white text-red-600 border border-red-300 hover:bg-red-50",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm font-bold rounded-md",
  md: "h-10 px-5 text-base rounded-sm",
  lg: "h-12 px-8 text-lg font-semibold rounded-sm",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    />
  ),
);
Button.displayName = "Button";
